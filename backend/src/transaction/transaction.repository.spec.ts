import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionRepository } from './transaction.repository';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let transactionRepo: Repository<Transaction>;
  let ledgerEntryRepo: Repository<LedgerEntry>;
  let dataSource: DataSource;

  const mockTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockLedgerEntryRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: '0.00' }),
        })),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: mockLedgerEntryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
    transactionRepo = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    ledgerEntryRepo = module.get<Repository<LedgerEntry>>(
      getRepositoryToken(LedgerEntry),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction with balanced ledger entries', async () => {
      const mockTransaction = {
        id: 'test-id',
        userId: 'user-id',
        type: 'TRANSFER',
        description: 'Test transfer',
      };

      mockTransactionRepo.create.mockReturnValue(mockTransaction);
      mockTransactionRepo.save.mockResolvedValue(mockTransaction);

      const ledgerEntries = [
        { accountId: 'account-1', amount: -100.0 },
        { accountId: 'account-2', amount: 100.0 },
      ];

      const result = await repository.create(
        'user-id',
        TransactionType.TRANSFER,
        'Test transfer',
        ledgerEntries,
      );

      expect(result).toBeDefined();
      expect(mockTransactionRepo.create).toHaveBeenCalled();
    });
  });
});
