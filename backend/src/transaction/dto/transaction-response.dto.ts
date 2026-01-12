import { Transaction, TransactionType } from '../entities/transaction.entity';
import { LedgerEntry } from '../entities/ledger-entry.entity';

export class LedgerEntryResponseDto {
  id: string;
  accountId: string;
  amount: string;
  description: string;
  createdAt: Date;
  account?: {
    id: string;
    name: string;
    accountNumber: string;
    currency: string;
  };

  static fromEntity(entry: LedgerEntry): LedgerEntryResponseDto {
    return {
      id: entry.id,
      accountId: entry.accountId,
      amount: entry.amount.toString(),
      description: entry.description,
      createdAt: entry.createdAt,
      account: entry.account
        ? {
            id: entry.account.id,
            name: entry.account.name,
            accountNumber: entry.account.accountNumber || '',
            currency: entry.account.currency,
          }
        : undefined,
    };
  }
}

export class TransactionResponseDto {
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  ledgerEntries: LedgerEntryResponseDto[];
  createdAt: Date;

  static fromEntity(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      description: transaction.description,
      ledgerEntries: transaction.ledgerEntries.map((entry) =>
        LedgerEntryResponseDto.fromEntity(entry),
      ),
      createdAt: transaction.createdAt,
    };
  }
}
