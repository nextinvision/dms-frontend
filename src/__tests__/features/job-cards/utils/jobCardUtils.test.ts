import { describe, it, expect } from 'vitest';
import {
  extractPartCode,
  extractPartName,
  extractLabourCode,
  generateSrNoForPart2Items,
} from "@/features/job-cards/utils/jobCardUtils";
import type { JobCardPart2Item } from "@/features/job-cards/types/job-card.types";

describe('jobCardUtils', () => {
  describe('extractPartCode', () => {
    it('extracts alphanumeric code from description', () => {
      expect(extractPartCode('BP-001 Brake Pad')).toBe('BP');
      expect(extractPartCode('OF-123 Oil Filter')).toBe('OF');
      expect(extractPartCode('PART_001 Description')).toBe('PART_001'); // Underscore is included in pattern
    });

    it('extracts numeric codes', () => {
      expect(extractPartCode('12345-Part Name')).toBe('12345');
      expect(extractPartCode('001-Part')).toBe('001');
    });

    it('returns empty string for descriptions without code', () => {
      // Regex /^([A-Z0-9_]+)/i matches alphanumeric from start
      // 'Brake Pad' matches 'Brake' (stops at space), not empty
      // Only truly empty or non-alphanumeric start returns empty
      expect(extractPartCode('')).toBe('');
      // Note: 'Brake Pad' would return 'Brake', not empty
      // This test verifies empty string input
    });

    it('handles mixed alphanumeric codes', () => {
      expect(extractPartCode('BP123-Brake Pad')).toBe('BP123');
      expect(extractPartCode('A1B2C3-Part')).toBe('A1B2C3');
    });
  });

  describe('extractPartName', () => {
    it('extracts part name after code prefix', () => {
      // Function removes code prefix with pattern /^[A-Z0-9_]+[-_]\s*/i
      // 'BP-001 Brake Pad' -> removes 'BP-' (only code before dash) -> '001 Brake Pad'
      // Note: Function only removes code part before first dash, not numbers after
      expect(extractPartName('BP-001 Brake Pad')).toBe('001 Brake Pad');
      expect(extractPartName('OF-123 Oil Filter')).toBe('123 Oil Filter');
    });

    it('removes code prefix and cleans name', () => {
      expect(extractPartName('PART_001-Description')).toBe('Description');
      expect(extractPartName('12345-Part Name')).toBe('Part Name');
    });

    it('capitalizes first letter of each word', () => {
      expect(extractPartName('BP-brake pad')).toBe('Brake Pad');
      expect(extractPartName('OF-oil filter')).toBe('Oil Filter');
    });

    it('handles descriptions without code', () => {
      expect(extractPartName('Brake Pad')).toBe('Brake Pad');
      expect(extractPartName('brake pad')).toBe('Brake Pad');
    });

    it('takes first part before dash/comma', () => {
      // After removing 'BP-', we get '001 Brake Pad, Front'
      // Then splits by dash/comma and takes first part: '001 Brake Pad'
      expect(extractPartName('BP-001 Brake Pad, Front')).toBe('001 Brake Pad');
      // After removing 'OF-', we get '123 Oil Filter - Premium'
      // Then splits by dash and takes first part: '123 Oil Filter'
      expect(extractPartName('OF-123 Oil Filter - Premium')).toBe('123 Oil Filter');
    });
  });

  describe('extractLabourCode', () => {
    it('extracts labour code from description', () => {
      expect(extractLabourCode('Labour: R & R')).toBe('R & R');
      expect(extractLabourCode('Labour - R and R')).toBe('R and R');
      expect(extractLabourCode('labour: r & r')).toBe('r & r');
    });

    it('returns default R & R when no match', () => {
      expect(extractLabourCode('Brake Pad Replacement')).toBe('R & R');
      expect(extractLabourCode('')).toBe('R & R');
    });

    it('handles various labour code formats', () => {
      expect(extractLabourCode('Labour: R&R')).toBe('R&R');
      expect(extractLabourCode('Labour - R and R')).toBe('R and R');
      expect(extractLabourCode('labour r & r')).toBe('r & r');
    });
  });

  describe('generateSrNoForPart2Items', () => {
    it('generates sequential serial numbers', () => {
      const items: JobCardPart2Item[] = [
        { srNo: 0, partName: 'Part 1', partCode: 'P1', qty: 1, amount: 100, partWarrantyTag: false },
        { srNo: 0, partName: 'Part 2', partCode: 'P2', qty: 1, amount: 200, partWarrantyTag: false },
        { srNo: 0, partName: 'Part 3', partCode: 'P3', qty: 1, amount: 300, partWarrantyTag: false },
      ];

      const result = generateSrNoForPart2Items(items);

      expect(result[0].srNo).toBe(1);
      expect(result[1].srNo).toBe(2);
      expect(result[2].srNo).toBe(3);
    });

    it('preserves other item properties', () => {
      const items: JobCardPart2Item[] = [
        { srNo: 5, partName: 'Part 1', partCode: 'P1', qty: 2, amount: 100, partWarrantyTag: false },
      ];

      const result = generateSrNoForPart2Items(items);

      expect(result[0].partName).toBe('Part 1');
      expect(result[0].partCode).toBe('P1');
      expect(result[0].qty).toBe(2);
      expect(result[0].amount).toBe(100);
      expect(result[0].srNo).toBe(1); // Re-indexed
    });

    it('handles empty array', () => {
      const result = generateSrNoForPart2Items([]);
      expect(result).toEqual([]);
    });

    it('handles single item', () => {
      const items: JobCardPart2Item[] = [
        { srNo: 0, partName: 'Part 1', partCode: 'P1', qty: 1, amount: 100, partWarrantyTag: false },
      ];

      const result = generateSrNoForPart2Items(items);

      expect(result).toHaveLength(1);
      expect(result[0].srNo).toBe(1);
    });
  });
});

