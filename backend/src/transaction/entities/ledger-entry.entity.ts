import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../account/entities/account.entity';
import { Transaction } from './transaction.entity';

/**
 * Ledger Entry - Immutable record of all account movements
 * Following double-entry accounting: SUM(amount) must equal 0 for each transaction
 */
@Entity('ledger_entries')
@Index(['transactionId'])
@Index(['accountId', 'createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number; // Positive for debits, negative for credits

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}
