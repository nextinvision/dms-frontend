import { describe, it, expect, vi, beforeEach } from 'vitest';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { Part, PartFormData } from '@/shared/types/inventory.types';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/app/inventory-manager/parts-master/storage.constants', () => ({
  PARTS_MASTER_STORAGE_KEYS: {
    PARTS_MASTER: 'partsMaster',
  },
}));

describe('PartsMasterService', () => {
  const mockPart: Part = {
    id: 'part-1',
    partId: 'PART-001',
    partName: 'Brake Pad',
    partNumber: 'BP-001',
    category: 'Brakes',
    price: 1000,
    stockQuantity: 10,
    minStockLevel: 5,
    unit: 'piece',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPartFormData: PartFormData = {
    partName: 'Brake Pad',
    partId: 'PART-001',
    partNumber: 'BP-001',
    category: 'Brakes',
    price: 1000,
    minStockLevel: 5,
    unit: 'piece',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('getAll', () => {
    it('returns all parts', async () => {
      const mockParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockParts);

      const parts = await partsMasterService.getAll();

      expect(parts).toEqual(mockParts);
      expect(parts).toHaveLength(1);
    });

    it('returns empty array when no parts exist', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const parts = await partsMasterService.getAll();

      expect(parts).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns part by id', async () => {
      const mockParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockParts);

      const part = await partsMasterService.getById('part-1');

      expect(part).toEqual(mockPart);
    });

    it('returns null if part not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const part = await partsMasterService.getById('nonexistent');

      expect(part).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a new part', async () => {
      const part = await partsMasterService.create(mockPartFormData);

      expect(part).toMatchObject({
        partName: 'Brake Pad',
        partId: 'PART-001',
        partNumber: 'BP-001',
        category: 'Brakes',
        price: 1000,
        stockQuantity: 0,
        minStockLevel: 5,
      });
      expect(part.id).toBeDefined();
      expect(part.createdAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('generates partId if not provided', async () => {
      const formDataWithoutId = { ...mockPartFormData };
      delete formDataWithoutId.partId;

      const part = await partsMasterService.create(formDataWithoutId);

      expect(part.partId).toBeDefined();
      expect(part.partId).toMatch(/^PART-/);
    });

    it('throws error if partName is missing', async () => {
      const invalidData = { ...mockPartFormData };
      delete invalidData.partName;

      await expect(partsMasterService.create(invalidData)).rejects.toThrow(
        'Part Name is required'
      );
    });

    it('throws error if duplicate partId exists', async () => {
      const existingParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      await expect(partsMasterService.create(mockPartFormData)).rejects.toThrow(
        'Part with ID "PART-001" already exists'
      );
    });

    it('throws error if duplicate partNumber exists', async () => {
      const existingParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const duplicateData = {
        ...mockPartFormData,
        partId: 'PART-002', // Different ID
      };

      await expect(partsMasterService.create(duplicateData)).rejects.toThrow(
        'Part with Number "BP-001" already exists'
      );
    });

    it('allows duplicate partNumber if partNumber is empty', async () => {
      const existingParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const dataWithoutNumber = {
        ...mockPartFormData,
        partId: 'PART-002',
        partNumber: '', // Empty partNumber
      };

      const part = await partsMasterService.create(dataWithoutNumber);

      expect(part).toBeDefined();
      expect(part.partNumber).toBe('');
    });
  });

  describe('update', () => {
    it('updates existing part', async () => {
      const existingParts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const updateData = { partName: 'Updated Brake Pad', price: 1200 };
      const updated = await partsMasterService.update('part-1', updateData);

      expect(updated.partName).toBe('Updated Brake Pad');
      expect(updated.price).toBe(1200);
      expect(updated.updatedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('throws error if part not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        partsMasterService.update('nonexistent', { partName: 'Test' })
      ).rejects.toThrow('Part not found');
    });
  });

  describe('delete', () => {
    it('deletes part by id', async () => {
      const existingParts = [mockPart, { ...mockPart, id: 'part-2' }];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      await partsMasterService.delete('part-1');

      expect(safeStorage.setItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([expect.objectContaining({ id: 'part-2' })])
      );
    });

    it('handles deletion of non-existent part gracefully', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await partsMasterService.delete('nonexistent');

      expect(safeStorage.setItem).toHaveBeenCalledWith(
        expect.anything(),
        []
      );
    });
  });

  describe('updateStock', () => {
    it('adds stock quantity', async () => {
      const existingParts = [{ ...mockPart, stockQuantity: 10 }];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const updated = await partsMasterService.updateStock('part-1', 5, 'add');

      expect(updated.stockQuantity).toBe(15);
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('subtracts stock quantity', async () => {
      const existingParts = [{ ...mockPart, stockQuantity: 10 }];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const updated = await partsMasterService.updateStock('part-1', 3, 'subtract');

      expect(updated.stockQuantity).toBe(7);
    });

    it('prevents negative stock when subtracting', async () => {
      const existingParts = [{ ...mockPart, stockQuantity: 5 }];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const updated = await partsMasterService.updateStock('part-1', 10, 'subtract');

      expect(updated.stockQuantity).toBe(0);
    });

    it('sets stock quantity', async () => {
      const existingParts = [{ ...mockPart, stockQuantity: 10 }];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingParts);

      const updated = await partsMasterService.updateStock('part-1', 20, 'set');

      expect(updated.stockQuantity).toBe(20);
    });

    it('throws error if part not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        partsMasterService.updateStock('nonexistent', 10, 'add')
      ).rejects.toThrow('Part not found');
    });
  });

  describe('bulkCreate', () => {
    it('creates multiple parts successfully', async () => {
      const partsData: PartFormData[] = [
        { partName: 'Part 1', partId: 'PART-001' },
        { partName: 'Part 2', partId: 'PART-002' },
      ];

      const result = await partsMasterService.bulkCreate(partsData);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('handles partial failures', async () => {
      const partsData: PartFormData[] = [
        { partName: 'Part 1', partId: 'PART-001' },
        { partName: '', partId: 'PART-002' }, // Invalid - missing partName
        { partName: 'Part 3', partId: 'PART-001' }, // Duplicate partId
      ];

      const result = await partsMasterService.bulkCreate(partsData);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates required partName for each part', async () => {
      const partsData: PartFormData[] = [
        { partName: 'Part 1', partId: 'PART-001' },
        { partName: '', partId: 'PART-002' },
      ];

      const result = await partsMasterService.bulkCreate(partsData);

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('Part Name is required');
    });
  });

  describe('searchParts', () => {
    it('searches parts by name', async () => {
      const parts = [
        mockPart,
        { ...mockPart, id: 'part-2', partName: 'Oil Filter', partId: 'PART-002' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(parts);

      const results = await partsMasterService.searchParts('brake');

      expect(results).toHaveLength(1);
      expect(results[0].partName).toBe('Brake Pad');
    });

    it('searches parts by partId', async () => {
      const parts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(parts);

      const results = await partsMasterService.searchParts('PART-001');

      expect(results).toHaveLength(1);
    });

    it('searches parts by partNumber', async () => {
      const parts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(parts);

      const results = await partsMasterService.searchParts('BP-001');

      expect(results).toHaveLength(1);
    });

    it('returns empty array for empty query', async () => {
      const parts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(parts);

      const results = await partsMasterService.searchParts('');

      expect(results).toEqual([]);
    });

    it('is case insensitive', async () => {
      const parts = [mockPart];
      vi.mocked(safeStorage.getItem).mockReturnValue(parts);

      const results = await partsMasterService.searchParts('BRAKE');

      expect(results).toHaveLength(1);
    });
  });
});

