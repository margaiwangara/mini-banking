import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { TransactionRepository } from '../transaction/transaction.repository';
import { AccountRepository } from '../account/account.repository';
import { AccountService } from '../account/account.service';
import {
  Transaction,
  TransactionType,
} from '../transaction/entities/transaction.entity';
import { LedgerEntry } from '../transaction/entities/ledger-entry.entity';
import { Currency } from '../account/entities/account.entity';
import { Decimal } from 'decimal.js';
import { DecimalUtil } from '../common/decimal.util';
import {
  InsufficientFundsException,
  InvalidTransactionException,
  AccountNotFoundException,
} from '../common/errors';

/**
 * Fixed exchange rate: 1 USD = 0.92 EUR
 */
const EXCHANGE_RATES = {
  [Currency.USD]: {
    [Currency.EUR]: new Decimal('0.92'),
  },
  [Currency.EUR]: {
    [Currency.USD]: new Decimal('1').div('0.92'), // ~1.086956
  },
};

@Injectable()
export class ExchangeService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Exchange currency between two accounts of different currencies
   * Creates two ledger entries (one for each account)
   */
  async exchange(
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: Decimal,
    description?: string,
  ): Promise<Transaction> {
    // Validate amount
    if (!DecimalUtil.isPositive(amount)) {
      throw new InvalidTransactionException('Exchange amount must be positive');
    }

    // Round to 2 decimal places
    const roundedAmount = DecimalUtil.round(amount);

    return await this.dataSource.transaction(async (manager) => {
      // Lock both accounts for update
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

      // Verify different currencies
      if (fromAccount.currency === toAccount.currency) {
        throw new InvalidTransactionException(
          'Exchange must be between accounts of different currencies',
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

      // Calculate exchange amount
      const rate = EXCHANGE_RATES[fromAccount.currency][toAccount.currency];
      const exchangedAmount = DecimalUtil.round(roundedAmount.mul(rate));

      // Create transaction with ledger entries using the existing transaction manager
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.EXCHANGE,
        description:
          description ||
          `Exchange ${DecimalUtil.toString(roundedAmount)} ${fromAccount.currency} to ${DecimalUtil.toString(exchangedAmount)} ${toAccount.currency} (rate: ${rate.toString()})`,
      });
      const savedTransaction = await manager.save(transaction);

      // Create ledger entries
      const ledgerEntries: Partial<LedgerEntry>[] = [
        {
          accountId: fromAccountId,
          amount: DecimalUtil.toNumber(roundedAmount.negated()), // Negative (outgoing)
          description:
            description ||
            `Exchange ${DecimalUtil.toString(roundedAmount)} ${fromAccount.currency} to ${toAccount.currency}`,
        },
        {
          accountId: toAccountId,
          amount: DecimalUtil.toNumber(exchangedAmount), // Positive (incoming)
          description:
            description ||
            `Exchange ${DecimalUtil.toString(exchangedAmount)} ${toAccount.currency} from ${fromAccount.currency} (rate: ${rate.toString()})`,
        },
      ];

      const entries = ledgerEntries.map((entry) =>
        manager.create(LedgerEntry, {
          ...entry,
          transactionId: savedTransaction.id,
        }),
      );
      await manager.save(entries);

      // Note: Currency exchanges don't balance to zero because they involve different currencies
      // The balance check is skipped for EXCHANGE transactions as the amounts are in different currencies
      // The exchange rate ensures proper conversion between currencies

      // Invalidate caches (outside transaction)
      await this.invalidateCaches(userId, [fromAccountId, toAccountId]);

      return savedTransaction;
    });
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(fromCurrency: Currency, toCurrency: Currency): Decimal {
    if (fromCurrency === toCurrency) {
      return new Decimal('1');
    }

    if (
      !EXCHANGE_RATES[fromCurrency] ||
      !EXCHANGE_RATES[fromCurrency][toCurrency]
    ) {
      throw new InvalidTransactionException(
        `Exchange rate not available from ${fromCurrency} to ${toCurrency}`,
      );
    }

    return EXCHANGE_RATES[fromCurrency][toCurrency];
  }

  /**
   * Calculate exchange amount without executing the exchange
   */
  calculateExchangeAmount(
    amount: Decimal,
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Decimal {
    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    return DecimalUtil.round(amount.mul(rate));
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
