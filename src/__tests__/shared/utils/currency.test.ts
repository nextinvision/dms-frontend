import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  parseCurrency,
  formatCurrencyCompact,
  calculatePercentage,
  calculateDiscount,
  calculateDiscountPercentage,
} from '@/shared/utils/currency';

describe('currency utils', () => {
  describe('formatCurrency', () => {
    it('formats number as INR currency', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1234567.89)).toBe('₹12,34,567.89');
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('formats string as INR currency', () => {
      expect(formatCurrency('1000')).toBe('₹1,000.00');
      expect(formatCurrency('₹1,000')).toBe('₹1,000.00');
      expect(formatCurrency('1,000')).toBe('₹1,000.00');
    });

    it('formats with custom currency', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('1,000.00');
      expect(result).toContain('USD');
    });

    it('handles decimal values', () => {
      expect(formatCurrency(1234.56)).toBe('₹1,234.56');
      expect(formatCurrency(0.99)).toBe('₹0.99');
    });
  });

  describe('parseCurrency', () => {
    it('parses currency string to number', () => {
      expect(parseCurrency('₹1,000')).toBe(1000);
      expect(parseCurrency('₹1,234.56')).toBe(1234.56);
      expect(parseCurrency('1,000')).toBe(1000);
      expect(parseCurrency('₹0')).toBe(0);
    });

    it('handles invalid input', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('₹')).toBe(0);
    });
  });

  describe('formatCurrencyCompact', () => {
    it('formats large numbers in compact form', () => {
      expect(formatCurrencyCompact(10000000)).toContain('Cr');
      expect(formatCurrencyCompact(100000)).toContain('L');
      expect(formatCurrencyCompact(1000)).toContain('K');
    });

    it('formats small numbers normally', () => {
      expect(formatCurrencyCompact(999)).toBe('₹999.00');
      expect(formatCurrencyCompact(500)).toBe('₹500.00');
    });

    it('handles string input', () => {
      expect(formatCurrencyCompact('100000')).toContain('L');
      expect(formatCurrencyCompact('₹1,000')).toContain('K');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
    });

    it('handles zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('handles decimal results', () => {
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 2);
    });
  });

  describe('calculateDiscount', () => {
    it('calculates discount amount', () => {
      expect(calculateDiscount(1000, 800)).toBe(200);
      expect(calculateDiscount(500, 400)).toBe(100);
      expect(calculateDiscount(100, 100)).toBe(0);
    });

    it('handles negative discount', () => {
      expect(calculateDiscount(100, 120)).toBe(-20);
    });
  });

  describe('calculateDiscountPercentage', () => {
    it('calculates discount percentage', () => {
      expect(calculateDiscountPercentage(1000, 800)).toBe(20);
      expect(calculateDiscountPercentage(500, 400)).toBe(20);
      expect(calculateDiscountPercentage(100, 100)).toBe(0);
    });

    it('handles zero original price', () => {
      expect(calculateDiscountPercentage(100, 0)).toBe(0);
    });

    it('handles negative discount', () => {
      expect(calculateDiscountPercentage(100, 120)).toBe(-20);
    });
  });
});

