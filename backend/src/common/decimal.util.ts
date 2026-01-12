import { Decimal } from 'decimal.js';

/**
 * Utility functions for handling money with Decimal.js
 * Never use JavaScript floats for financial calculations
 */

export class DecimalUtil {
  /**
   * Create a Decimal from a number, string, or Decimal
   */
  static from(value: number | string | Decimal): Decimal {
    if (value instanceof Decimal) {
      return value;
    }
    return new Decimal(value);
  }

  /**
   * Convert Decimal to number for database storage (NUMERIC(14,2))
   * Rounds to 2 decimal places
   */
  static toNumber(decimal: Decimal): number {
    return decimal.toDecimalPlaces(2).toNumber();
  }

  /**
   * Convert Decimal to string with 2 decimal places
   */
  static toString(decimal: Decimal): string {
    return decimal.toDecimalPlaces(2).toString();
  }

  /**
   * Validate that a Decimal is positive
   */
  static isPositive(value: Decimal): boolean {
    return value.gt(0);
  }

  /**
   * Validate that a Decimal is non-negative
   */
  static isNonNegative(value: Decimal): boolean {
    return value.gte(0);
  }

  /**
   * Round to 2 decimal places (for storage boundaries only)
   */
  static round(value: Decimal): Decimal {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }
}
