import { Currency } from '../../account/entities/account.entity';

export class ExchangeRateDto {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  exampleAmount: string;
  exampleResult: string;
}
