import { describe, it, expect, vi, beforeEach } from 'vitest';
import { centralPurchaseOrderService } from '@/features/inventory/services/centralPurchaseOrder.service';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { API_CONFIG } from '@/config/api.config';
import type { PurchaseOrder } from '@/shared/types/central-inventory.types';

// Mock dependencies
vi.mock('@/config/api.config', () => ({
  API_CONFIG: {
    USE_MOCK: true,
  },
}));

vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getAllPurchaseOrders: vi.fn(),
    getPurchaseOrderById: vi.fn(),
    approvePurchaseOrder: vi.fn(),
    rejectPurchaseOrder: vi.fn(),
    getPurchaseOrdersByStatus: vi.fn(),
    getPurchaseOrdersByServiceCenter: vi.fn(),
  },
}));

vi.mock('@/core/api', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('CentralPurchaseOrderService', () => {
  const mockPurchaseOrder: PurchaseOrder = {
    id: 'po-1',
    poNumber: 'PO-2024-001',
    serviceCenterId: 'sc-001',
    items: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as PurchaseOrder;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPurchaseOrders', () => {
    it('returns all purchase orders', async () => {
      vi.mocked(centralInventoryRepository.getAllPurchaseOrders).mockResolvedValue([mockPurchaseOrder]);

      const orders = await centralPurchaseOrderService.getAllPurchaseOrders();

      expect(orders).toEqual([mockPurchaseOrder]);
      expect(centralInventoryRepository.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  describe('getPurchaseOrderById', () => {
    it('returns purchase order by id', async () => {
      vi.mocked(centralInventoryRepository.getPurchaseOrderById).mockResolvedValue(mockPurchaseOrder);

      const order = await centralPurchaseOrderService.getPurchaseOrderById('po-1');

      expect(order).toEqual(mockPurchaseOrder);
      expect(centralInventoryRepository.getPurchaseOrderById).toHaveBeenCalledWith('po-1');
    });

    it('throws error if order not found', async () => {
      vi.mocked(centralInventoryRepository.getPurchaseOrderById).mockResolvedValue(null);

      await expect(
        centralPurchaseOrderService.getPurchaseOrderById('nonexistent')
      ).rejects.toThrow('Purchase order not found');
    });
  });

  describe('approvePurchaseOrder', () => {
    it('approves purchase order', async () => {
      const approvedOrder = { ...mockPurchaseOrder, status: 'approved' };
      vi.mocked(centralInventoryRepository.approvePurchaseOrder).mockResolvedValue(approvedOrder);

      const result = await centralPurchaseOrderService.approvePurchaseOrder(
        'po-1',
        'Manager',
        [{ itemId: 'item-1', approvedQty: 10 }]
      );

      expect(result.status).toBe('approved');
      expect(centralInventoryRepository.approvePurchaseOrder).toHaveBeenCalledWith(
        'po-1',
        'Manager',
        [{ itemId: 'item-1', approvedQty: 10 }]
      );
    });

    it('approves without approvedItems', async () => {
      const approvedOrder = { ...mockPurchaseOrder, status: 'approved' };
      vi.mocked(centralInventoryRepository.approvePurchaseOrder).mockResolvedValue(approvedOrder);

      const result = await centralPurchaseOrderService.approvePurchaseOrder('po-1', 'Manager');

      expect(result.status).toBe('approved');
    });
  });

  describe('rejectPurchaseOrder', () => {
    it('rejects purchase order', async () => {
      const rejectedOrder = {
        ...mockPurchaseOrder,
        status: 'rejected',
        rejectionReason: 'Not approved',
      };
      vi.mocked(centralInventoryRepository.rejectPurchaseOrder).mockResolvedValue(rejectedOrder);

      const result = await centralPurchaseOrderService.rejectPurchaseOrder(
        'po-1',
        'Manager',
        'Not approved'
      );

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Not approved');
      expect(centralInventoryRepository.rejectPurchaseOrder).toHaveBeenCalledWith(
        'po-1',
        'Manager',
        'Not approved'
      );
    });
  });

  describe('getPurchaseOrdersByStatus', () => {
    it('returns orders by status', async () => {
      const pendingOrders = [{ ...mockPurchaseOrder, status: 'pending' }];
      vi.mocked(centralInventoryRepository.getPurchaseOrdersByStatus).mockResolvedValue(pendingOrders);

      const orders = await centralPurchaseOrderService.getPurchaseOrdersByStatus('pending');

      expect(orders).toEqual(pendingOrders);
      expect(centralInventoryRepository.getPurchaseOrdersByStatus).toHaveBeenCalledWith('pending');
    });
  });

  describe('getPurchaseOrdersByServiceCenter', () => {
    it('returns orders by service center', async () => {
      const scOrders = [{ ...mockPurchaseOrder, serviceCenterId: 'sc-001' }];
      vi.mocked(centralInventoryRepository.getPurchaseOrdersByServiceCenter).mockResolvedValue(scOrders);

      const orders = await centralPurchaseOrderService.getPurchaseOrdersByServiceCenter('sc-001');

      expect(orders).toEqual(scOrders);
      expect(centralInventoryRepository.getPurchaseOrdersByServiceCenter).toHaveBeenCalledWith('sc-001');
    });
  });
});

