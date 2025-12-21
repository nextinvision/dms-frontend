import { describe, it, expect, vi, beforeEach } from 'vitest';
import { partsEntryService } from '@/features/inventory/services/partsEntry.service';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { PartsEntry } from '@/features/inventory/services/partsEntry.service';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/partsMaster.service', () => ({
  partsMasterService: {
    getById: vi.fn(),
    updateStock: vi.fn(),
  },
}));

describe('PartsEntryService', () => {
  const mockEntry: PartsEntry = {
    id: 'entry-1',
    invoiceNumber: 'INV-001',
    vendor: 'Vendor ABC',
    entryDate: '2024-01-15',
    parts: [
      {
        partId: 'part-1',
        partName: 'Brake Pad',
        quantity: 10,
        unitPrice: 1000,
      },
    ],
    totalAmount: 10000,
    createdAt: new Date().toISOString(),
    createdBy: 'Inventory Manager',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('getAll', () => {
    it('returns all parts entries', async () => {
      const mockEntries = [mockEntry];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockEntries);

      const entries = await partsEntryService.getAll();

      expect(entries).toEqual(mockEntries);
      expect(entries).toHaveLength(1);
    });

    it('returns empty array when no entries exist', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const entries = await partsEntryService.getAll();

      expect(entries).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns entry by id', async () => {
      const mockEntries = [mockEntry];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockEntries);

      const entry = await partsEntryService.getById('entry-1');

      expect(entry).toEqual(mockEntry);
    });

    it('returns null if entry not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const entry = await partsEntryService.getById('nonexistent');

      expect(entry).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a new parts entry', async () => {
      const mockPart = {
        id: 'part-1',
        stockQuantity: 50,
      };
      vi.mocked(partsMasterService.getById).mockResolvedValue(mockPart as any);
      vi.mocked(partsMasterService.updateStock).mockResolvedValue({
        ...mockPart,
        stockQuantity: 60,
      } as any);

      const entry = await partsEntryService.create(
        'INV-001',
        'Vendor ABC',
        '2024-01-15',
        [
          {
            partId: 'part-1',
            partName: 'Brake Pad',
            quantity: 10,
            unitPrice: 1000,
          },
        ],
        'Inventory Manager'
      );

      expect(entry).toMatchObject({
        invoiceNumber: 'INV-001',
        vendor: 'Vendor ABC',
        entryDate: '2024-01-15',
        totalAmount: 10000,
        createdBy: 'Inventory Manager',
      });
      expect(entry.id).toBeDefined();
      expect(entry.createdAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('calculates total amount correctly', async () => {
      vi.mocked(partsMasterService.getById).mockResolvedValue({ id: 'part-1' } as any);
      vi.mocked(partsMasterService.updateStock).mockResolvedValue({ id: 'part-1' } as any);

      const entry = await partsEntryService.create(
        'INV-001',
        'Vendor ABC',
        '2024-01-15',
        [
          { partId: 'part-1', partName: 'Part 1', quantity: 5, unitPrice: 100 },
          { partId: 'part-2', partName: 'Part 2', quantity: 3, unitPrice: 200 },
        ]
      );

      expect(entry.totalAmount).toBe(1100); // (5 * 100) + (3 * 200)
    });

    it('updates stock for each part', async () => {
      const mockPart1 = { id: 'part-1', stockQuantity: 50 };
      const mockPart2 = { id: 'part-2', stockQuantity: 30 };

      vi.mocked(partsMasterService.getById)
        .mockResolvedValueOnce(mockPart1 as any)
        .mockResolvedValueOnce(mockPart2 as any);
      vi.mocked(partsMasterService.updateStock)
        .mockResolvedValueOnce({ ...mockPart1, stockQuantity: 60 } as any)
        .mockResolvedValueOnce({ ...mockPart2, stockQuantity: 40 } as any);

      await partsEntryService.create(
        'INV-001',
        'Vendor ABC',
        '2024-01-15',
        [
          { partId: 'part-1', partName: 'Part 1', quantity: 10, unitPrice: 100 },
          { partId: 'part-2', partName: 'Part 2', quantity: 10, unitPrice: 200 },
        ]
      );

      expect(partsMasterService.updateStock).toHaveBeenCalledTimes(2);
      expect(partsMasterService.updateStock).toHaveBeenCalledWith('part-1', 10, 'add');
      expect(partsMasterService.updateStock).toHaveBeenCalledWith('part-2', 10, 'add');
    });

    it('handles missing parts gracefully', async () => {
      vi.mocked(partsMasterService.getById).mockResolvedValue(null);

      const entry = await partsEntryService.create(
        'INV-001',
        'Vendor ABC',
        '2024-01-15',
        [
          { partId: 'part-nonexistent', partName: 'Part 1', quantity: 10, unitPrice: 100 },
        ]
      );

      expect(entry).toBeDefined();
      expect(partsMasterService.updateStock).not.toHaveBeenCalled();
    });

    it('uses default createdBy if not provided', async () => {
      vi.mocked(partsMasterService.getById).mockResolvedValue({ id: 'part-1' } as any);
      vi.mocked(partsMasterService.updateStock).mockResolvedValue({ id: 'part-1' } as any);

      const entry = await partsEntryService.create(
        'INV-001',
        'Vendor ABC',
        '2024-01-15',
        [{ partId: 'part-1', partName: 'Part 1', quantity: 10, unitPrice: 100 }]
      );

      expect(entry.createdBy).toBe('Inventory Manager');
    });
  });

  describe('getRecent', () => {
    it('returns recent entries sorted by date', async () => {
      const mockEntries = [
        { ...mockEntry, id: 'entry-1', createdAt: '2024-01-10T10:00:00Z' },
        { ...mockEntry, id: 'entry-2', createdAt: '2024-01-15T10:00:00Z' },
        { ...mockEntry, id: 'entry-3', createdAt: '2024-01-12T10:00:00Z' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockEntries);

      const recent = await partsEntryService.getRecent(2);

      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe('entry-2'); // Most recent first
      expect(recent[1].id).toBe('entry-3');
    });

    it('uses default limit of 10', async () => {
      const mockEntries = Array.from({ length: 15 }, (_, i) => ({
        ...mockEntry,
        id: `entry-${i}`,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
      }));
      vi.mocked(safeStorage.getItem).mockReturnValue(mockEntries);

      const recent = await partsEntryService.getRecent();

      expect(recent).toHaveLength(10);
    });
  });
});

