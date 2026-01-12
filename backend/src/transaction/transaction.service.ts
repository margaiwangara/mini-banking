import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { TransactionRepository } from './transaction.repository';
import { AccountRepository } from '../account/account.repository';
import { AccountService } from '../account/account.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Decimal } from 'decimal.js';
import { DecimalUtil } from '../common/decimal.util';
import {
  InsufficientFundsException,
  InvalidTransactionException,
  AccountNotFoundException,
} from '../common/errors';
import { SYSTEM_EQUITY_ACCOUNT_ID, DEFAULT_USER_ID } from '../common/constants';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Transfer money between two accounts
   * Uses row-level locking to prevent race conditions
   */
  async transfer(
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: Decimal,
    description?: string,
  ): Promise<Transaction> {
    // Validate amount
    if (!DecimalUtil.isPositive(amount)) {
      throw new InvalidTransactionException('Transfer amount must be positive');
    }

    // Round to 2 decimal places
    const roundedAmount = DecimalUtil.round(amount);

    return await this.dataSource.transaction(async (manager) => {
      // Lock both accounts for update (prevents concurrent modifications)
      const fromAccount = await manager
        .createQueryBuilder()
        .select('account')
        .from('accounts', 'account')
        .where('account.id = :id', { id: fromAccountId })
        .setLock('pessimistic_write')
        .getOne();

      const toAccount = await manager
        .createQueryBuilder()
        .select('account')
        .from('accounts', 'account')
        .where('account.id = :id', { id: toAccountId })
        .setLock('pessimistic_write')
        .getOne();

      if (!fromAccount) {
        throw new AccountNotFoundException(fromAccountId);
      }
      if (!toAccount) {
        throw new AccountNotFoundException(toAccountId);
      }

      // Verify accounts belong to user
      if (fromAccount.userId !== userId || toAccount.userId !== userId) {
        throw new InvalidTransactionException(
          'Accounts must belong to the user',
        );
      }

      // Verify same currency
      if (fromAccount.currency !== toAccount.currency) {
        throw new InvalidTransactionException(
          'Transfer must be between accounts of the same currency',
        );
      }

      // Calculate current balance from ledger
      const accountBalanceResult = await manager
        .createQueryBuilder()
        .select('COALESCE(SUM(amount), 0)', 'balance')
        .from('ledger_entries', 'le')
        .where('le.accountId = :accountId', { accountId: fromAccountId })
        .getRawOne();

      const currentBalance = DecimalUtil.from(accountBalanceResult.balance);

      // Check sufficient funds
      if (currentBalance.lt(roundedAmount)) {
        throw new InsufficientFundsException(
          DecimalUtil.toString(currentBalance),
        );
      }

      // Create transaction with ledger entries using the existing transaction manager
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.TRANSFER,
        description:
          description ||
          `Transfer from ${fromAccount.name} to ${toAccount.name}`,
      });
      const savedTransaction = await manager.save(transaction);

      // Create ledger entries (debit from source, credit to destination)
      const ledgerEntries: Partial<LedgerEntry>[] = [
        {
          accountId: fromAccountId,
          amount: DecimalUtil.toNumber(roundedAmount.negated()), // Negative (credit/outgoing)
          description: description || `Transfer to ${toAccount.name}`,
        },
        {
          accountId: toAccountId,
          amount: DecimalUtil.toNumber(roundedAmount), // Positive (debit/incoming)
          description: description || `Transfer from ${fromAccount.name}`,
        },
      ];

      const entries = ledgerEntries.map((entry) =>
        manager.create(LedgerEntry, {
          ...entry,
          transactionId: savedTransaction.id,
        }),
      );
      await manager.save(entries);

      // Validate ledger balance (must sum to 0)
      const ledgerBalanceResult = await manager
        .createQueryBuilder()
        .select('COALESCE(SUM(amount), 0)', 'total')
        .from(LedgerEntry, 'le')
        .where('le.transactionId = :transactionId', {
          transactionId: savedTransaction.id,
        })
        .getRawOne();

      const total = parseFloat(ledgerBalanceResult.total);
      if (Math.abs(total) > 0.01) {
        throw new InvalidTransactionException(
          `Ledger imbalance detected: transaction ${savedTransaction.id} has total ${total}, expected 0`,
        );
      }

      // Invalidate caches (outside transaction)
      await this.invalidateCaches(userId, [fromAccountId, toAccountId]);

      return savedTransaction;
    });
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new InvalidTransactionException(`Transaction ${id} not found`);
    }
    return transaction;
  }

  async getTransactionsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    type?: TransactionType,
  ): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId, limit, offset, type);
  }

  /**
   * Create a deposit transaction
   * For double-entry accounting, deposits credit the user account and debit a system equity account
   */
  async deposit(
    userId: string,
    accountId: string,
    amount: Decimal,
    description?: string,
  ): Promise<Transaction> {
    // Validate amount
    if (!DecimalUtil.isPositive(amount)) {
      throw new InvalidTransactionException('Deposit amount must be positive');
    }

    // Round to 2 decimal places
    const roundedAmount = DecimalUtil.round(amount);

    return await this.dataSource.transaction(async (manager) => {
      // Lock account for update
      const account = await manager
        .createQueryBuilder()
        .select('account')
        .from('accounts', 'account')
        .where('account.id = :id', { id: accountId })
        .setLock('pessimistic_write')
        .getOne();

      if (!account) {
        throw new AccountNotFoundException(accountId);
      }

      // Verify account belongs to user
      if (account.userId !== userId) {
        throw new InvalidTransactionException(
          'Account must belong to the user',
        );
      }

      // For deposits, we need balanced entries:
      // 1. Credit to user account (positive - money coming in)
      // 2. Debit to system equity (negative - source of funds)
      // Ensure system equity account exists (create if it doesn't)
      let systemAccount = await manager
        .createQueryBuilder()
        .select('account')
        .from('accounts', 'account')
        .where('account.id = :id', { id: SYSTEM_EQUITY_ACCOUNT_ID })
        .getOne();

      if (!systemAccount) {
        // Create system equity account if it doesn't exist
        // Using raw query to insert within transaction context
        await manager.query(
          `INSERT INTO accounts (id, "userId", currency, name, "createdAt", "updatedAt")
           SELECT $1, $2, $3, $4, NOW(), NOW()
           WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = $1)`,
          [
            SYSTEM_EQUITY_ACCOUNT_ID,
            DEFAULT_USER_ID,
            'USD', // System account currency doesn't matter for equity
            'System Equity Account',
          ],
        );
      }

      // Create ledger entries
      const ledgerEntries: Partial<LedgerEntry>[] = [
        {
          accountId: accountId,
          amount: DecimalUtil.toNumber(roundedAmount), // Positive (credit to user account)
          description: description || `Deposit to ${account.name}`,
        },
        {
          accountId: SYSTEM_EQUITY_ACCOUNT_ID,
          amount: DecimalUtil.toNumber(roundedAmount.negated()), // Negative (debit from system equity)
          description: description || `System deposit for ${account.name}`,
        },
      ];

      // Create transaction with ledger entries using the existing transaction manager
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.DEPOSIT,
        description:
          description ||
          `Deposit ${DecimalUtil.toString(roundedAmount)} ${account.currency} to ${account.name}`,
      });
      const savedTransaction = await manager.save(transaction);

      // Create ledger entries
      const entries = ledgerEntries.map((entry) =>
        manager.create(LedgerEntry, {
          ...entry,
          transactionId: savedTransaction.id,
        }),
      );
      await manager.save(entries);

      // Validate ledger balance (must sum to 0)
      const balanceResult = await manager
        .createQueryBuilder()
        .select('COALESCE(SUM(amount), 0)', 'total')
        .from(LedgerEntry, 'le')
        .where('le.transactionId = :transactionId', {
          transactionId: savedTransaction.id,
        })
        .getRawOne();

      const total = parseFloat(balanceResult.total);
      if (Math.abs(total) > 0.01) {
        throw new InvalidTransactionException(
          `Ledger imbalance detected: transaction ${savedTransaction.id} has total ${total}, expected 0`,
        );
      }

      // Invalidate caches (outside transaction)
      await this.invalidateCaches(userId, [accountId]);

      return savedTransaction;
    });
  }

  async getRecentTransactions(userId: string): Promise<Transaction[]> {
    const cacheKey = `user:${userId}:recent-transactions`;

    // Try cache first
    const cached = await this.cacheManager.get<Transaction[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const transactions = await this.transactionRepository.findRecentByUserId(
      userId,
      5,
    );

    // Cache the result
    await this.cacheManager.set(cacheKey, transactions, 300); // 5 minutes TTL

    return transactions;
  }

  private async invalidateCaches(
    userId: string,
    accountIds: string[],
  ): Promise<void> {
    // Invalidate account balances
    for (const accountId of accountIds) {
      await this.accountService.invalidateAccountBalanceCache(accountId);
    }

    // Invalidate user accounts list
    await this.accountService.invalidateUserAccountsCache(userId);

    // Invalidate recent transactions
    await this.accountService.invalidateUserRecentTransactionsCache(userId);
  }
}
