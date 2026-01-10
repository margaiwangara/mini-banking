import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { TransactionService } from '../transaction/transaction.service';
import { User } from '../user/entities/user.entity';
import { Currency } from '../account/entities/account.entity';
import { JwtPayload } from './strategies/jwt.strategy';
import { Decimal } from 'decimal.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    return this.userService.validateUser(email, password);
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<{ access_token: string; user: any }> {
    const user = await this.userService.createUser(email, password, name);

    // Create default USD and EUR accounts for new user
    const usdAccount = await this.accountService.createAccount(
      user.id,
      Currency.USD,
      'USD Account',
    );
    const eurAccount = await this.accountService.createAccount(
      user.id,
      Currency.EUR,
      'EUR Account',
    );

    // Initialize accounts with 5000 each
    const initialBalance = new Decimal('5000');
    await this.transactionService.deposit(
      user.id,
      usdAccount.id,
      initialBalance,
      'Initial account balance',
    );
    await this.transactionService.deposit(
      user.id,
      eurAccount.id,
      initialBalance,
      'Initial account balance',
    );

    return this.login(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
