import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { LedgerEntry } from './ledger-entry.entity';

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  EXCHANGE = 'EXCHANGE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  type: TransactionType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => LedgerEntry, (ledgerEntry) => ledgerEntry.transaction, {
    cascade: true,
  })
  ledgerEntries: LedgerEntry[];
}
