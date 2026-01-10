import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountNumber1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists, if not add it
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='accounts' AND column_name='accountNumber'
    `);

    if (columnExists.length === 0) {
      // Add accountNumber column
      await queryRunner.query(`
        ALTER TABLE accounts
        ADD COLUMN "accountNumber" VARCHAR(20)
      `);

      // Create unique index
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_account_number 
        ON accounts("accountNumber")
        WHERE "accountNumber" IS NOT NULL
      `);

      // Generate account numbers for existing accounts using CTE
      await queryRunner.query(`
        WITH numbered_accounts AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY "createdAt") as row_num
          FROM accounts
          WHERE "accountNumber" IS NULL
        )
        UPDATE accounts
        SET "accountNumber" = 'ACC-' || 
          LPAD((na.row_num)::text, 12, '0')
        FROM numbered_accounts na
        WHERE accounts.id = na.id
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE accounts
      DROP COLUMN IF EXISTS "accountNumber"
    `);
  }
}
