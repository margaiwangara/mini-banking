import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransferDto } from './dto/transfer.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionType } from './entities/transaction.entity';
import { DecimalUtil } from '../common/decimal.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async transfer(
    @Body() transferDto: TransferDto,
    @Request() req: any,
  ): Promise<TransactionResponseDto> {
    const userId = req.user.id;

    const amount = DecimalUtil.from(transferDto.amount);
    const transaction = await this.transactionService.transfer(
      userId,
      transferDto.fromAccountId,
      transferDto.toAccountId,
      amount,
      transferDto.description,
    );

    const fullTransaction = await this.transactionService.getTransactionById(
      transaction.id,
    );

    return TransactionResponseDto.fromEntity(fullTransaction);
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions with pagination and filtering' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of transactions to skip (default: 0)' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'Filter by transaction type' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ): Promise<TransactionResponseDto[]> {
    const userId = req.user.id;

    const transactions = await this.transactionService.getTransactionsByUserId(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      type as TransactionType | undefined,
    );

    return transactions.map((t) => TransactionResponseDto.fromEntity(t));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions (last 5)' })
  @ApiResponse({ status: 200, description: 'Recent transactions retrieved successfully' })
  async getRecentTransactions(
    @Request() req: any,
  ): Promise<TransactionResponseDto[]> {
    const userId = req.user.id;

    const transactions =
      await this.transactionService.getRecentTransactions(userId);

    return transactions.map((t) => TransactionResponseDto.fromEntity(t));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.getTransactionById(id);
    return TransactionResponseDto.fromEntity(transaction);
  }
}
