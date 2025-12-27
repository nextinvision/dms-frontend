import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobCardPartsRequestService } from '@/features/inventory/services/jobCardPartsRequest.service';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';
import { stockUpdateHistoryService } from '@/features/inventory/services/stockUpdateHistory.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockJobCard } from '@/test/utils/mocks';
import type { JobCardPartsRequest } from '@/shared/types/jobcard-inventory.types';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/partsMaster.service', () => ({
  partsMasterService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    updateStock: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/stockUpdateHistory.service', () => ({
  stockUpdateHistoryService: {
    recordUpdate: vi.fn(),
  },
}));

describe('JobCardPartsRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('createRequestFromJobCard', () => {
    it('creates a parts request from job card', async () => {
      const jobCard = createMockJobCard({
        id: 'jc-1',
        jobCardNumber: 'JC-001',
        customerName: 'Test Customer',
        vehicleId: 'v-1',
        registration: 'ABC123',
      });

      const parts = [
        { partId: 'p-1', partName: 'Brake Pad', quantity: 2 },
        { partId: 'p-2', partName: 'Oil Filter', quantity: 1 },
      ];

      const request = await jobCardPartsRequestService.createRequestFromJobCard(
        jobCard,
        parts,
        'Test Engineer'
      );

      expect(request).toMatchObject({
        jobCardId: 'jc-1',
        customerName: 'Test Customer',
        requestedBy: 'Test Engineer',
        status: 'pending',
        parts,
      });

      expect(request.id).toBeDefined();
      expect(request.requestedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('uses jobCardNumber when id is not available', async () => {
      const jobCard = createMockJobCard({
        jobCardNumber: 'JC-002',
        customerName: 'Test Customer',
      });
      delete (jobCard as any).id;

      const request = await jobCardPartsRequestService.createRequestFromJobCard(
        jobCard,
        [],
        'Test Engineer'
      );

      expect(request.jobCardId).toBe('JC-002');
    });
  });

  describe('getAll', () => {
    it('returns all requests', async () => {
      const mockRequests: JobCardPartsRequest[] = [
        {
          id: 'req-1',
          jobCardId: 'jc-1',
          status: 'pending',
          requestedBy: 'Engineer 1',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
        {
          id: 'req-2',
          jobCardId: 'jc-2',
          status: 'approved',
          requestedBy: 'Engineer 2',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
      ];

      vi.mocked(safeStorage.getItem).mockReturnValue(mockRequests);

      const requests = await jobCardPartsRequestService.getAll();

      expect(requests).toEqual(mockRequests);
      expect(requests).toHaveLength(2);
    });
  });

  describe('getPending', () => {
    it('returns only pending requests', async () => {
      const mockRequests: JobCardPartsRequest[] = [
        {
          id: 'req-1',
          jobCardId: 'jc-1',
          status: 'pending',
          requestedBy: 'Engineer 1',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
        {
          id: 'req-2',
          jobCardId: 'jc-2',
          status: 'approved',
          requestedBy: 'Engineer 2',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
      ];

      vi.mocked(safeStorage.getItem).mockReturnValue(mockRequests);

      const pending = await jobCardPartsRequestService.getPending();

      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('pending');
    });
  });

  describe('getById', () => {
    it('returns request by id', async () => {
      const mockRequest: JobCardPartsRequest = {
        id: 'req-1',
        jobCardId: 'jc-1',
        status: 'pending',
        requestedBy: 'Engineer 1',
        requestedAt: new Date().toISOString(),
        parts: [],
      };

      vi.mocked(safeStorage.getItem).mockReturnValue([mockRequest]);

      const request = await jobCardPartsRequestService.getById('req-1');

      expect(request).toEqual(mockRequest);
    });

    it('returns null if request not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const request = await jobCardPartsRequestService.getById('req-nonexistent');

      expect(request).toBeNull();
    });
  });

  describe('getByJobCardId', () => {
    it('returns requests for specific job card', async () => {
      const mockRequests: JobCardPartsRequest[] = [
        {
          id: 'req-1',
          jobCardId: 'jc-1',
          status: 'pending',
          requestedBy: 'Engineer 1',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
        {
          id: 'req-2',
          jobCardId: 'jc-1',
          status: 'approved',
          requestedBy: 'Engineer 2',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
        {
          id: 'req-3',
          jobCardId: 'jc-2',
          status: 'pending',
          requestedBy: 'Engineer 3',
          requestedAt: new Date().toISOString(),
          parts: [],
        },
      ];

      vi.mocked(safeStorage.getItem).mockReturnValue(mockRequests);

      const requests = await jobCardPartsRequestService.getByJobCardId('jc-1');

      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.jobCardId === 'jc-1')).toBe(true);
    });
  });

  describe('approveByScManager', () => {
    it('approves request by SC manager', async () => {
      const mockRequest: JobCardPartsRequest = {
        id: 'req-1',
        jobCardId: 'jc-1',
        status: 'pending',
        requestedBy: 'Engineer 1',
        requestedAt: new Date().toISOString(),
        parts: [],
      };

      vi.mocked(safeStorage.getItem).mockReturnValue([mockRequest]);

      const approved = await jobCardPartsRequestService.approveByScManager(
        'req-1',
        'SC Manager',
        'Approved for service'
      );

      expect(approved.scManagerApproved).toBe(true);
      expect(approved.scManagerApprovedBy).toBe('SC Manager');
      expect(approved.scManagerApprovedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('throws error if request not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        jobCardPartsRequestService.approveByScManager('req-nonexistent', 'SC Manager')
      ).rejects.toThrow('Request not found');
    });
  });

  describe('assignPartsByInventoryManager', () => {
    it('assigns parts and decreases stock', async () => {
      const mockRequest: JobCardPartsRequest = {
        id: 'req-1',
        jobCardId: 'jc-1',
        status: 'pending',
        requestedBy: 'Engineer 1',
        requestedAt: new Date().toISOString(),
        scManagerApproved: true,
        scManagerApprovedBy: 'SC Manager',
        scManagerApprovedAt: new Date().toISOString(),
        parts: [
          { partId: 'p-1', partName: 'Brake Pad', quantity: 2 },
        ],
      };

      const mockPart = {
        id: 'p-1',
        partName: 'Brake Pad',
        stockQuantity: 10,
      };

      vi.mocked(safeStorage.getItem).mockReturnValue([mockRequest]);
      vi.mocked(partsMasterService.getById).mockResolvedValue(mockPart as any);
      vi.mocked(partsMasterService.getAll).mockResolvedValue([mockPart] as any);
      vi.mocked(partsMasterService.updateStock).mockResolvedValue({
        ...mockPart,
        stockQuantity: 8,
      } as any);
      vi.mocked(stockUpdateHistoryService.recordUpdate).mockResolvedValue(undefined);

      const assigned = await jobCardPartsRequestService.assignPartsByInventoryManager(
        'req-1',
        'Inventory Manager',
        'Engineer 1'
      );

      expect(assigned.inventoryManagerAssigned).toBe(true);
      expect(assigned.assignedEngineer).toBe('Engineer 1');
      expect(assigned.status).toBe('approved');
      expect(partsMasterService.updateStock).toHaveBeenCalled();
      expect(stockUpdateHistoryService.recordUpdate).toHaveBeenCalled();
    });

    it('throws error if request not approved by SC manager', async () => {
      const mockRequest: JobCardPartsRequest = {
        id: 'req-1',
        jobCardId: 'jc-1',
        status: 'pending',
        requestedBy: 'Engineer 1',
        requestedAt: new Date().toISOString(),
        parts: [],
      };

      vi.mocked(safeStorage.getItem).mockReturnValue([mockRequest]);

      await expect(
        jobCardPartsRequestService.assignPartsByInventoryManager(
          'req-1',
          'Inventory Manager',
          'Engineer 1'
        )
      ).rejects.toThrow('Request must be approved by SC Manager first');
    });

    it('throws error if insufficient stock', async () => {
      const mockRequest: JobCardPartsRequest = {
        id: 'req-1',
        jobCardId: 'jc-1',
        status: 'pending',
        requestedBy: 'Engineer 1',
        requestedAt: new Date().toISOString(),
        scManagerApproved: true,
        scManagerApprovedBy: 'SC Manager',
        scManagerApprovedAt: new Date().toISOString(),
        parts: [
          { partId: 'p-1', partName: 'Brake Pad', quantity: 10 },
        ],
      };

      const mockPart = {
        id: 'p-1',
        partName: 'Brake Pad',
        stockQuantity: 5, // Less than required
      };

      vi.mocked(safeStorage.getItem).mockReturnValue([mockRequest]);
      vi.mocked(partsMasterService.getById).mockResolvedValue(mockPart as any);
      vi.mocked(partsMasterService.getAll).mockResolvedValue([mockPart] as any);

      await expect(
        jobCardPartsRequestService.assignPartsByInventoryManager(
          'req-1',
          'Inventory Manager',
          'Engineer 1'
        )
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('checkPartsAvailability', () => {
    it('returns available when all parts have sufficient stock', async () => {
      const mockPart = {
        id: 'p-1',
        partName: 'Brake Pad',
        stockQuantity: 10,
      };

      vi.mocked(partsMasterService.getById).mockResolvedValue(mockPart as any);

      const result = await jobCardPartsRequestService.checkPartsAvailability([
        { partId: 'p-1', quantity: 5 },
      ]);

      expect(result.available).toBe(true);
      expect(result.unavailableParts).toHaveLength(0);
    });

    it('returns unavailable when stock is insufficient', async () => {
      const mockPart = {
        id: 'p-1',
        partName: 'Brake Pad',
        stockQuantity: 3,
      };

      vi.mocked(partsMasterService.getById).mockResolvedValue(mockPart as any);

      const result = await jobCardPartsRequestService.checkPartsAvailability([
        { partId: 'p-1', quantity: 5 },
      ]);

      expect(result.available).toBe(false);
      expect(result.unavailableParts).toHaveLength(1);
      expect(result.unavailableParts[0].partName).toBe('Brake Pad');
    });

    it('handles missing parts', async () => {
      vi.mocked(partsMasterService.getById).mockResolvedValue(null);

      const result = await jobCardPartsRequestService.checkPartsAvailability([
        { partId: 'p-nonexistent', quantity: 5 },
      ]);

      expect(result.available).toBe(false);
      expect(result.unavailableParts[0].partName).toBe('Unknown Part');
    });
  });
});

