import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuotationNumber } from '@/shared/utils/quotation.utils';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockQuotation } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/shared/utils/service-center.utils', () => ({
  getServiceCenterCode: vi.fn((id) => {
    const codeMap: Record<string, string> = {
      '1': 'SC001',
      'sc-001': 'SC001',
      '2': 'SC002',
      'sc-002': 'SC002',
    };
    return codeMap[id] || 'SC001';
  }),
  normalizeServiceCenterId: vi.fn((id) => {
    if (typeof id === 'string' && id.startsWith('sc-')) return id;
    return `sc-${String(id).padStart(3, '0')}`;
  }),
}));

describe('quotation.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('generateQuotationNumber', () => {
    it('generates quotation number with correct format', () => {
      const number = generateQuotationNumber('1', new Date('2024-01-15'));

      expect(number).toMatch(/^QT-SC001-202401-\d{4}$/);
      expect(number).toContain('QT-SC001-202401-');
    });

    it('uses current date when date not provided', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const number = generateQuotationNumber('1');

      expect(number).toContain(`QT-SC001-${year}${month}-`);
    });

    it('increments sequence for same service center and month', () => {
      const date = new Date('2024-01-15');
      const existingQuotations = [
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0001',
          quotationDate: '2024-01-10',
          serviceCenterId: '1',
        }),
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0002',
          quotationDate: '2024-01-12',
          serviceCenterId: '1',
        }),
      ];

      const number = generateQuotationNumber('1', date, existingQuotations);

      expect(number).toBe('QT-SC001-202401-0003');
    });

    it('starts sequence at 0001 for new month', () => {
      const date = new Date('2024-02-15');
      const existingQuotations = [
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0005',
          quotationDate: '2024-01-15',
          serviceCenterId: '1',
        }),
      ];

      const number = generateQuotationNumber('1', date, existingQuotations);

      expect(number).toBe('QT-SC001-202402-0001');
    });

    it('filters by service center correctly', () => {
      const date = new Date('2024-01-15');
      const existingQuotations = [
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0001',
          quotationDate: '2024-01-10',
          serviceCenterId: '1',
        }),
        createMockQuotation({
          quotationNumber: 'QT-SC002-202401-0001',
          quotationDate: '2024-01-10',
          serviceCenterId: '2',
        }),
      ];

      const number = generateQuotationNumber('1', date, existingQuotations);

      // Should only count SC001 quotations
      expect(number).toBe('QT-SC001-202401-0002');
    });

    it('reads from localStorage when quotations not provided', () => {
      const storedQuotations = [
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0001',
          quotationDate: '2024-01-10',
          serviceCenterId: '1',
        }),
      ];

      vi.mocked(safeStorage.getItem).mockReturnValue(storedQuotations);

      const number = generateQuotationNumber('1', new Date('2024-01-15'));

      expect(number).toBe('QT-SC001-202401-0002');
      expect(safeStorage.getItem).toHaveBeenCalledWith('quotations', []);
    });

    it('handles string date input', () => {
      const number = generateQuotationNumber('1', '2024-03-15');

      expect(number).toContain('QT-SC001-202403-');
    });

    it('handles different service center IDs', () => {
      const number1 = generateQuotationNumber('1', new Date('2024-01-15'));
      const number2 = generateQuotationNumber('2', new Date('2024-01-15'));

      expect(number1).toContain('SC001');
      expect(number2).toContain('SC002');
    });

    it('finds maximum sequence correctly', () => {
      const date = new Date('2024-01-15');
      const existingQuotations = [
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0001',
          quotationDate: '2024-01-10',
          serviceCenterId: '1',
        }),
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0005',
          quotationDate: '2024-01-12',
          serviceCenterId: '1',
        }),
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0003',
          quotationDate: '2024-01-11',
          serviceCenterId: '1',
        }),
      ];

      const number = generateQuotationNumber('1', date, existingQuotations);

      // Should use max sequence (5) + 1 = 6
      expect(number).toBe('QT-SC001-202401-0006');
    });

    it('handles quotations with invalid number format', () => {
      const date = new Date('2024-01-15');
      const existingQuotations = [
        createMockQuotation({
          quotationNumber: 'INVALID-FORMAT',
          quotationDate: '2024-01-10',
          serviceCenterId: '1',
        }),
        createMockQuotation({
          quotationNumber: 'QT-SC001-202401-0002',
          quotationDate: '2024-01-12',
          serviceCenterId: '1',
        }),
      ];

      const number = generateQuotationNumber('1', date, existingQuotations);

      // Should ignore invalid format and use valid one
      expect(number).toBe('QT-SC001-202401-0003');
    });
  });
});

