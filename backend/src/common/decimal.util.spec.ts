import { Decimal } from 'decimal.js';
import { DecimalUtil } from './decimal.util';

describe('DecimalUtil', () => {
  describe('from', () => {
    it('should create Decimal from number', () => {
      const result = DecimalUtil.from(100.5);
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toNumber()).toBe(100.5);
    });

    it('should create Decimal from string', () => {
      const result = DecimalUtil.from('100.5');
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toNumber()).toBe(100.5);
    });

    it('should return Decimal if already Decimal', () => {
      const input = new Decimal(100.5);
      const result = DecimalUtil.from(input);
      expect(result).toBe(input);
    });
  });

  describe('toNumber', () => {
    it('should convert Decimal to number with 2 decimal places', () => {
      const decimal = new Decimal('100.567');
      const result = DecimalUtil.toNumber(decimal);
      expect(result).toBe(100.57);
    });
  });

  describe('toString', () => {
    it('should convert Decimal to string with 2 decimal places', () => {
      const decimal = new Decimal('100.567');
      const result = DecimalUtil.toString(decimal);
      expect(result).toBe('100.57');
    });
  });

  describe('isPositive', () => {
    it('should return true for positive values', () => {
      expect(DecimalUtil.isPositive(new Decimal('100'))).toBe(true);
      expect(DecimalUtil.isPositive(new Decimal('0.01'))).toBe(true);
    });

    it('should return false for zero or negative values', () => {
      expect(DecimalUtil.isPositive(new Decimal('0'))).toBe(false);
      expect(DecimalUtil.isPositive(new Decimal('-100'))).toBe(false);
    });
  });

  describe('isNonNegative', () => {
    it('should return true for zero and positive values', () => {
      expect(DecimalUtil.isNonNegative(new Decimal('0'))).toBe(true);
      expect(DecimalUtil.isNonNegative(new Decimal('100'))).toBe(true);
    });

    it('should return false for negative values', () => {
      expect(DecimalUtil.isNonNegative(new Decimal('-100'))).toBe(false);
    });
  });

  describe('round', () => {
    it('should round to 2 decimal places', () => {
      const result = DecimalUtil.round(new Decimal('100.567'));
      expect(result.toNumber()).toBe(100.57);
    });
  });
});
