import { describe, it, expect, vi, beforeEach } from 'vitest';
import { centralStockService } from '@/features/inventory/services/centralStock.service';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { API_CONFIG } from '@/config/api.config';
import type { CentralStock, StockUpdateFormData } from '@/shared/types/central-inventory.types';

// Mock dependencies
vi.mock('@/config/api.config', () => ({
  API_CONFIG: {
    USE_MOCK: true,
  },
}));

vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getAllStock: vi.fn(),
    getStockById: vi.fn(),
    updateStock: vi.fn(),
    adjustStock: vi.fn(),
    searchStock: vi.fn(),
  },
}));

vi.mock('@/core/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
  mockApiClient: {
    registerMock: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number, code: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
    status: number;
    code: string;
  },
}));

describe('CentralStockService', () => {
  const mockStock: CentralStock = {
    id: 'stock-1',
    partId: 'part-1',
    partName: 'Brake Pad',
    partNumber: 'BP-001',
    stockQuantity: 100,
    minStockLevel: 20,
    location: 'Warehouse A',
    updatedAt: new Date().toISOString(),
  } as CentralStock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCentralStock', () => {
    it('returns all stock items', async () => {
      vi.mocked(centralInventoryRepository.getAllStock).mockResolvedValue([mockStock]);

      const stock = await centralStockService.getCentralStock();

      expect(stock).toEqual([mockStock]);
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
  });

  describe('getStockById', () => {
    it('returns stock by id', async () => {
      vi.mocked(centralInventoryRepository.getStockById).mockResolvedValue(mockStock);

      const stock = await centralStockService.getStockById('stock-1');

      expect(stock).toEqual(mockStock);
      expect(centralInventoryRepository.getStockById).toHaveBeenCalledWith('stock-1');
    });

    it('throws error if stock not found', async () => {
      vi.mocked(centralInventoryRepository.getStockById).mockResolvedValue(null);

      await expect(centralStockService.getStockById('nonexistent')).rejects.toThrow(
        'Stock not found'
      );
    });
  });

  describe('updateStock', () => {
    it('updates stock data', async () => {
      const updatedStock = { ...mockStock, stockQuantity: 150 };
      vi.mocked(centralInventoryRepository.updateStock).mockResolvedValue(updatedStock);

      const result = await centralStockService.updateStock('stock-1', {
        stockQuantity: 150,
      });

      expect(result).toEqual(updatedStock);
      expect(centralInventoryRepository.updateStock).toHaveBeenCalledWith('stock-1', {
        stockQuantity: 150,
      });
    });
  });

  describe('addStock', () => {
    it('adds stock quantity', async () => {
      const adjustment: StockUpdateFormData = {
        partId: 'part-1',
        adjustmentType: 'add',
        quantity: 50,
        reason: 'New stock received',
      };

      const result = {
        stock: { ...mockStock, stockQuantity: 150 },
        adjustment: { id: 'adj-1', ...adjustment },
      };

      vi.mocked(centralInventoryRepository.adjustStock).mockResolvedValue(result);

      const response = await centralStockService.addStock(
        'stock-1',
        50,
        'New stock received',
        'Inventory Manager',
        'REF-001'
      );

      expect(response.stock.stockQuantity).toBe(150);
      expect(centralInventoryRepository.adjustStock).toHaveBeenCalled();
    });
  });

  describe('deductStock', () => {
    it('deducts stock quantity', async () => {
      const adjustment: StockUpdateFormData = {
        partId: 'part-1',
        adjustmentType: 'remove',
        quantity: 30,
        reason: 'Parts issued',
      };

      const result = {
        stock: { ...mockStock, stockQuantity: 70 },
        adjustment: { id: 'adj-1', ...adjustment },
      };

      vi.mocked(centralInventoryRepository.adjustStock).mockResolvedValue(result);

      const response = await centralStockService.deductStock(
        'stock-1',
        30,
        'Parts issued',
        'Inventory Manager',
        'REF-002'
      );

      expect(response.stock.stockQuantity).toBe(70);
      expect(centralInventoryRepository.adjustStock).toHaveBeenCalled();
    });
  });

  describe('searchStock', () => {
    it('searches stock by query', async () => {
      vi.mocked(centralInventoryRepository.searchStock).mockResolvedValue([mockStock]);

      const results = await centralStockService.searchStock('brake');

      expect(results).toEqual([mockStock]);
      expect(centralInventoryRepository.searchStock).toHaveBeenCalledWith('brake');
    });
  });
});

