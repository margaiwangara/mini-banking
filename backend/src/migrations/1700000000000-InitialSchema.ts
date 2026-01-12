import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        currency VARCHAR(3) NOT NULL,
        name VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create ledger_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "transactionId" UUID NOT NULL,
        "accountId" UUID NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_transaction FOREIGN KEY ("transactionId") REFERENCES transactions(id) ON DELETE CASCADE,
        CONSTRAINT fk_account FOREIGN KEY ("accountId") REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger_entries("transactionId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries("accountId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_created ON ledger_entries("accountId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ledger_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS accounts`);
  }
}
