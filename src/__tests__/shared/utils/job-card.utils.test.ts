import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateJobCardNumber, getNextSequenceNumber } from "@/shared/utils/job-card.utils";
import { getServiceCenterCode } from "@/shared/utils/service-center.utils";
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockJobCard } from '@/test/utils/mocks';
import type { JobCard } from '@/shared/types/job-card.types';

// Mock dependencies - must be defined inside factory function due to hoisting
vi.mock('@/shared/utils/service-center.utils', () => ({
  getServiceCenterCode: vi.fn((id) => 'SC001'),
}));

vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('job-card.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default values
    vi.mocked(getServiceCenterCode).mockReturnValue('SC001');
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('getNextSequenceNumber', () => {
    it('returns 1 for empty job cards', () => {
      const result = getNextSequenceNumber([], 'SC001', 2024, '01');
      expect(result).toBe(1);
    });

    it('returns next sequence for existing job cards', () => {
      const existingJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0001' }),
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0002' }),
      ];

      const result = getNextSequenceNumber(existingJobCards, 'SC001', 2024, '01');
      expect(result).toBe(3);
    });

    it('filters by service center code and date', () => {
      const existingJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0005' }),
        createMockJobCard({ jobCardNumber: 'SC002-2024-01-0001' }), // Different SC
        createMockJobCard({ jobCardNumber: 'SC001-2024-02-0001' }), // Different month
      ];

      const result = getNextSequenceNumber(existingJobCards, 'SC001', 2024, '01');
      expect(result).toBe(6); // Only counts SC001-2024-01-*
    });

    it('handles job cards without numbers', () => {
      const existingJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: undefined }),
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0001' }),
      ];

      const result = getNextSequenceNumber(existingJobCards, 'SC001', 2024, '01');
      expect(result).toBe(2);
    });

    it('sorts correctly to find highest sequence', () => {
      const existingJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0001' }),
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0005' }),
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0003' }),
      ];

      const result = getNextSequenceNumber(existingJobCards, 'SC001', 2024, '01');
      expect(result).toBe(6); // Should use 0005 as highest
    });
  });

  describe('generateJobCardNumber', () => {
    it('generates job card number with correct format', () => {
      const result = generateJobCardNumber('sc-001');
      
      expect(result).toMatch(/^SC001-\d{4}-\d{2}-\d{4}$/);
      expect(getServiceCenterCode).toHaveBeenCalledWith('sc-001');
    });

    it('uses current year and month', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const result = generateJobCardNumber('sc-001');
      
      expect(result).toContain(`${year}-${month}`);
    });

    it('starts sequence at 0001 for new month', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);
      
      const result = generateJobCardNumber('sc-001');
      
      expect(result).toMatch(/-0001$/);
    });

    it('increments sequence for existing job cards', () => {
      const existingJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0001' }),
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0002' }),
      ];
      
      vi.mocked(safeStorage.getItem).mockReturnValue(existingJobCards);
      
      const result = generateJobCardNumber('sc-001', existingJobCards);
      
      expect(result).toMatch(/-0003$/);
    });

    it('uses provided job cards instead of localStorage', () => {
      const providedJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0005' }),
      ];
      
      const result = generateJobCardNumber('sc-001', providedJobCards);
      
      expect(result).toMatch(/-0006$/);
      expect(safeStorage.getItem).not.toHaveBeenCalled();
    });

    it('reads from localStorage when job cards not provided', () => {
      const storedJobCards: JobCard[] = [
        createMockJobCard({ jobCardNumber: 'SC001-2024-01-0010' }),
      ];
      
      vi.mocked(safeStorage.getItem).mockReturnValue(storedJobCards);
      
      generateJobCardNumber('sc-001');
      
      expect(safeStorage.getItem).toHaveBeenCalledWith('jobCards', []);
    });

    it('pads sequence number to 4 digits', () => {
      const result = generateJobCardNumber('sc-001');
      
      const parts = result.split('-');
      expect(parts[3]).toHaveLength(4);
      expect(parts[3]).toMatch(/^\d{4}$/);
    });
  });
});

