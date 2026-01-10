import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ enum: Currency, example: Currency.USD, description: 'Account currency' })
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @ApiProperty({ example: 'My USD Account', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
