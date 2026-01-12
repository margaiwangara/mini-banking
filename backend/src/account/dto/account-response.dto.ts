import { Account, Currency } from '../entities/account.entity';

export class AccountResponseDto {
  id: string;
  userId: string;
  currency: Currency;
  name: string;
  accountNumber: string;
  balance: string; // Decimal as string
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(account: Account, balance: string): AccountResponseDto {
    return {
      id: account.id,
      userId: account.userId,
      currency: account.currency,
      name: account.name,
      accountNumber: account.accountNumber || '',
      balance,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
