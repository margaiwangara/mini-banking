import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientFundsException extends HttpException {
  constructor(availableBalance: string) {
    super(
      {
        error: 'INSUFFICIENT_FUNDS',
        message: `Available balance is ${availableBalance}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidTransactionException extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'INVALID_TRANSACTION',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AccountNotFoundException extends HttpException {
  constructor(accountId: string) {
    super(
      {
        error: 'ACCOUNT_NOT_FOUND',
        message: `Account with ID ${accountId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class LedgerImbalanceException extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'LEDGER_IMBALANCE',
        message: `Ledger validation failed: ${message}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
