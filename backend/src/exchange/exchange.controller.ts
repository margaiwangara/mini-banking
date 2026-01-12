import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { TransactionService } from '../transaction/transaction.service';
import { ExchangeDto } from './dto/exchange.dto';
import { ExchangeRateDto } from './dto/exchange-rate.dto';
import { TransactionResponseDto } from '../transaction/dto/transaction-response.dto';
import { Currency } from '../account/entities/account.entity';
import { DecimalUtil } from '../common/decimal.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Decimal } from 'decimal.js';

@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exchange currency between accounts' })
  @ApiResponse({ status: 201, description: 'Exchange completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid exchange request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exchange(
    @Body() exchangeDto: ExchangeDto,
    @Request() req: any,
  ): Promise<TransactionResponseDto> {
    const userId = req.user.id;

    const amount = DecimalUtil.from(exchangeDto.amount);
    const transaction = await this.exchangeService.exchange(
      userId,
      exchangeDto.fromAccountId,
      exchangeDto.toAccountId,
      amount,
      exchangeDto.description,
    );

    const fullTransaction = await this.transactionService.getTransactionById(
      transaction.id,
    );

    return TransactionResponseDto.fromEntity(fullTransaction);
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get exchange rate (public endpoint)' })
  @ApiQuery({ name: 'from', enum: Currency, description: 'Source currency' })
  @ApiQuery({ name: 'to', enum: Currency, description: 'Target currency' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved successfully' })
  async getExchangeRate(
    @Query('from') fromCurrency: Currency,
    @Query('to') toCurrency: Currency,
  ): Promise<ExchangeRateDto> {
    const rate = this.exchangeService.getExchangeRate(fromCurrency, toCurrency);
    const exampleAmount = new Decimal('100');
    const exampleResult = this.exchangeService.calculateExchangeAmount(
      exampleAmount,
      fromCurrency,
      toCurrency,
    );

    return {
      fromCurrency,
      toCurrency,
      rate: rate.toString(),
      exampleAmount: DecimalUtil.toString(exampleAmount),
      exampleResult: DecimalUtil.toString(exampleResult),
    };
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate exchange amount (public endpoint)' })
  @ApiQuery({ name: 'amount', type: String, description: 'Amount to exchange' })
  @ApiQuery({ name: 'from', enum: Currency, description: 'Source currency' })
  @ApiQuery({ name: 'to', enum: Currency, description: 'Target currency' })
  @ApiResponse({ status: 200, description: 'Exchange calculation completed' })
  async calculateExchange(
    @Query('amount') amount: string,
    @Query('from') fromCurrency: Currency,
    @Query('to') toCurrency: Currency,
  ): Promise<{ amount: string; result: string; rate: string }> {
    const amountDecimal = DecimalUtil.from(amount);
    const rate = this.exchangeService.getExchangeRate(fromCurrency, toCurrency);
    const result = this.exchangeService.calculateExchangeAmount(
      amountDecimal,
      fromCurrency,
      toCurrency,
    );

    return {
      amount: DecimalUtil.toString(amountDecimal),
      result: DecimalUtil.toString(result),
      rate: rate.toString(),
    };
  }
}
