import { Module } from '@nestjs/common';
import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';
import { TransactionModule } from '../transaction/transaction.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [TransactionModule, AccountModule],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
