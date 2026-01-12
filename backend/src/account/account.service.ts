import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AccountRepository } from './account.repository';
import { Account, Currency } from './entities/account.entity';
import { Decimal } from 'decimal.js';
import { DecimalUtil } from '../common/decimal.util';
import { AccountNotFoundException } from '../common/errors';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async createAccount(
    userId: string,
    currency: Currency,
    name: string,
  ): Promise<Account> {
    const account = await this.accountRepository.create(userId, currency, name);
    
    // Invalidate user accounts cache
    await this.invalidateUserAccountsCache(userId);
    
    return account;
  }

  async getAccountById(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new AccountNotFoundException(id);
    }
    return account;
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    const cacheKey = `user:${userId}:accounts`;
    
    // Try cache first
    const cached = await this.cacheManager.get<Account[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const accounts = await this.accountRepository.findByUserId(userId);
    
    // Cache the result
    await this.cacheManager.set(cacheKey, accounts, 300); // 5 minutes TTL
    
    return accounts;
  }

  /**
   * Get account balance with caching
   * Balance is derived from ledger entries, never stored directly
   */
  async getAccountBalance(accountId: string): Promise<Decimal> {
    const cacheKey = `account:${accountId}:balance`;
    
    // Try cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return DecimalUtil.from(cached);
    }

    // Calculate from ledger
    const balance = await this.accountRepository.calculateBalance(accountId);
    
    // Cache the result
    await this.cacheManager.set(
      cacheKey,
      DecimalUtil.toString(balance),
      300, // 5 minutes TTL
    );
    
    return balance;
  }

  /**
   * Invalidate account balance cache
   */
  async invalidateAccountBalanceCache(accountId: string): Promise<void> {
    await this.cacheManager.del(`account:${accountId}:balance`);
  }

  /**
   * Invalidate user accounts cache
   */
  async invalidateUserAccountsCache(userId: string): Promise<void> {
    await this.cacheManager.del(`user:${userId}:accounts`);
  }

  /**
   * Invalidate user recent transactions cache
   */
  async invalidateUserRecentTransactionsCache(userId: string): Promise<void> {
    await this.cacheManager.del(`user:${userId}:recent-transactions`);
  }
}
