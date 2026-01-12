import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { DecimalUtil } from '../common/decimal.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid account data' })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Request() req: any,
  ): Promise<AccountResponseDto> {
    const userId = req.user.id;

    const account = await this.accountService.createAccount(
      userId,
      createAccountDto.currency,
      createAccountDto.name,
    );

    const balance = await this.accountService.getAccountBalance(account.id);

    return AccountResponseDto.fromEntity(
      account,
      DecimalUtil.toString(balance),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all user accounts with balances' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getAccounts(@Request() req: any): Promise<AccountResponseDto[]> {
    const userId = req.user?.id;

    const accounts = await this.accountService.getAccountsByUserId(userId);

    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.accountService.getAccountBalance(account.id);
        return AccountResponseDto.fromEntity(
          account,
          DecimalUtil.toString(balance),
        );
      }),
    );

    return accountsWithBalances;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID with balance' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('id') id: string): Promise<AccountResponseDto> {
    const account = await this.accountService.getAccountById(id);
    const balance = await this.accountService.getAccountBalance(account.id);

    return AccountResponseDto.fromEntity(
      account,
      DecimalUtil.toString(balance),
    );
  }
}
