import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stockUpdateHistoryService } from '@/features/inventory/services/stockUpdateHistory.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { StockUpdateHistory } from '@/features/inventory/services/stockUpdateHistory.service';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('StockUpdateHistoryService', () => {
  const mockUpdate: StockUpdateHistory = {
    id: 'update-1',
    partId: 'part-1',
    partName: 'Brake Pad',
    partNumber: 'BP-001',
    quantity: 10,
    operation: 'decrease',
    previousStock: 100,
    newStock: 90,
    jobCardId: 'jc-1',
    jobCardNumber: 'JC-001',
    customerName: 'John Doe',
    assignedEngineer: 'Engineer 1',
    updatedBy: 'Inventory Manager',
    updatedAt: new Date().toISOString(),
    reason: 'Parts assigned to engineer',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('recordUpdate', () => {
    it('records a stock update', async () => {
      const update = await stockUpdateHistoryService.recordUpdate(
        'part-1',
        'Brake Pad',
        'BP-001',
        10,
        'decrease',
        100,
        90,
        'jc-1',
        'JC-001',
        'John Doe',
        'Engineer 1',
        'Inventory Manager',
        'Parts assigned'
      );

      expect(update).toMatchObject({
        partId: 'part-1',
        partName: 'Brake Pad',
        quantity: 10,
        operation: 'decrease',
        previousStock: 100,
        newStock: 90,
        jobCardId: 'jc-1',
      });
      expect(update.id).toBeDefined();
      expect(update.updatedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('records increase operation', async () => {
      const update = await stockUpdateHistoryService.recordUpdate(
        'part-1',
        'Brake Pad',
        'BP-001',
        20,
        'increase',
        100,
        120,
        'jc-1'
      );

      expect(update.operation).toBe('increase');
      expect(update.previousStock).toBe(100);
      expect(update.newStock).toBe(120);
    });

    it('uses default values for optional parameters', async () => {
      const update = await stockUpdateHistoryService.recordUpdate(
        'part-1',
        'Brake Pad',
        'BP-001',
        10,
        'decrease',
        100,
        90,
        'jc-1'
      );

      expect(update.updatedBy).toBe('Inventory Manager');
      expect(update.reason).toBe('Parts assigned from job card');
    });
  });

  describe('getAll', () => {
    it('returns all stock update history', async () => {
      const mockHistory = [mockUpdate];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const history = await stockUpdateHistoryService.getAll();

      expect(history).toEqual(mockHistory);
      expect(history).toHaveLength(1);
    });

    it('returns empty array when no history exists', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const history = await stockUpdateHistoryService.getAll();

      expect(history).toEqual([]);
    });
  });

  describe('getByPartId', () => {
    it('returns updates for specific part', async () => {
      const mockHistory = [
        mockUpdate,
        { ...mockUpdate, id: 'update-2', partId: 'part-2' },
        { ...mockUpdate, id: 'update-3', partId: 'part-1' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const updates = await stockUpdateHistoryService.getByPartId('part-1');

      expect(updates).toHaveLength(2);
      expect(updates.every(u => u.partId === 'part-1')).toBe(true);
    });

    it('returns empty array if no updates for part', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([mockUpdate]);

      const updates = await stockUpdateHistoryService.getByPartId('nonexistent');

      expect(updates).toEqual([]);
    });
  });

  describe('getByJobCardId', () => {
    it('returns updates for specific job card', async () => {
      const mockHistory = [
        mockUpdate,
        { ...mockUpdate, id: 'update-2', jobCardId: 'jc-2' },
        { ...mockUpdate, id: 'update-3', jobCardId: 'jc-1' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const updates = await stockUpdateHistoryService.getByJobCardId('jc-1');

      expect(updates).toHaveLength(2);
      expect(updates.every(u => u.jobCardId === 'jc-1')).toBe(true);
    });
  });

  describe('getRecent', () => {
    it('returns recent updates with default limit', async () => {
      const mockHistory = Array.from({ length: 100 }, (_, i) => ({
        ...mockUpdate,
        id: `update-${i}`,
      }));
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const recent = await stockUpdateHistoryService.getRecent();

      expect(recent).toHaveLength(50);
    });

    it('returns recent updates with custom limit', async () => {
      const mockHistory = Array.from({ length: 100 }, (_, i) => ({
        ...mockUpdate,
        id: `update-${i}`,
      }));
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const recent = await stockUpdateHistoryService.getRecent(10);

      expect(recent).toHaveLength(10);
    });

    it('returns all updates if limit exceeds total', async () => {
      const mockHistory = [mockUpdate];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockHistory);

      const recent = await stockUpdateHistoryService.getRecent(100);

      expect(recent).toHaveLength(1);
    });
  });
});

