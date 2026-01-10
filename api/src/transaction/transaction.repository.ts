import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    type: TransactionType,
    description: string,
    ledgerEntries: Partial<LedgerEntry>[],
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create transaction
      const transaction = this.transactionRepository.create({
        userId,
        type,
        description,
      });
      const savedTransaction = await queryRunner.manager.save(transaction);

      // Create ledger entries
      const entries = ledgerEntries.map((entry) =>
        this.ledgerEntryRepository.create({
          ...entry,
          transactionId: savedTransaction.id,
        }),
      );
      await queryRunner.manager.save(entries);

      // Validate ledger balance (must sum to 0)
      await this.validateLedgerBalance(savedTransaction.id, queryRunner);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate that ledger entries for a transaction sum to 0
   * This enforces double-entry accounting
   */
  private async validateLedgerBalance(
    transactionId: string,
    queryRunner: any,
  ): Promise<void> {
    const result = await queryRunner.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(amount), 0)', 'total')
      .from(LedgerEntry, 'le')
      .where('le.transactionId = :transactionId', { transactionId })
      .getRawOne();

    const total = parseFloat(result.total);
    if (Math.abs(total) > 0.01) {
      // Allow for rounding differences up to 1 cent
      throw new Error(
        `Ledger imbalance detected: transaction ${transactionId} has total ${total}, expected 0`,
      );
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['ledgerEntries', 'ledgerEntries.account'],
    });
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    type?: TransactionType,
  ): Promise<Transaction[]> {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    return this.transactionRepository.find({
      where,
      relations: ['ledgerEntries', 'ledgerEntries.account'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findRecentByUserId(userId: string, limit: number = 5): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      relations: ['ledgerEntries', 'ledgerEntries.account'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
