import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, Currency } from './entities/account.entity';
import { Decimal } from 'decimal.js';
import { DecimalUtil } from '../common/decimal.util';

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, currency: Currency, name: string): Promise<Account> {
    // Generate account number: format as ACC-XXXX-XXXX-XXXX
    // Uses timestamp + random + user ID hash for uniqueness
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const userIdHash = userId.slice(0, 4).replace(/-/g, '');
    const accountNumber = `ACC-${timestamp.slice(0, 4)}-${timestamp.slice(4)}-${random}`;
    
    const account = this.accountRepository.create({
      userId,
      currency,
      name,
      accountNumber,
    });
    return this.accountRepository.save(account);
  }

  async findById(id: string): Promise<Account | null> {
    return this.accountRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdForUpdate(id: string): Promise<Account | null> {
    return this.accountRepository
      .createQueryBuilder('account')
      .where('account.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }

  /**
   * Calculate account balance from ledger entries
   * This is the authoritative balance calculation
   */
  async calculateBalance(accountId: string): Promise<Decimal> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(amount), 0)', 'balance')
      .from('ledger_entries', 'le')
      .where('le.accountId = :accountId', { accountId })
      .getRawOne();

    return DecimalUtil.from(result.balance);
  }
}
