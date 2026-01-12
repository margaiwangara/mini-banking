import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExchangeModule } from './exchange/exchange.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { typeOrmConfig } from './config/typeorm.config';
import { cacheConfig } from './config/cache.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    CacheModule.register(cacheConfig),
    AccountModule,
    TransactionModule,
    ExchangeModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
