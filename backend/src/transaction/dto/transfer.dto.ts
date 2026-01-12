import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Source account ID' })
  @IsString()
  @IsNotEmpty()
  fromAccountId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Destination account ID' })
  @IsString()
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({ example: 100.50, description: 'Transfer amount (minimum 0.01)', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({ example: 'Payment for services', description: 'Optional transfer description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
