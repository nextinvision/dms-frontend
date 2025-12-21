import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryApprovalService } from '@/features/inventory/services/inventory-approval.service';
import { API_CONFIG } from '@/config/api.config';
import type { InventoryApproval, InventoryApprovalRequest } from '@/features/inventory/services/inventory-approval.service';

// Mock dependencies
vi.mock('@/config/api.config', () => ({
  API_CONFIG: {
    USE_MOCK: true,
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

describe('InventoryApprovalService', () => {
  const mockApproval: InventoryApproval = {
    id: 'ia-1',
    quotationId: 'q-1',
    items: [
      { partName: 'Brake Pad', partNumber: 'BP-001', quantity: 2 },
    ],
    status: 'pending',
    notes: 'Test approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRequest: InventoryApprovalRequest = {
    quotationId: 'q-1',
    items: [
      { partName: 'Brake Pad', partNumber: 'BP-001', quantity: 2 },
    ],
    notes: 'Test approval',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns all approvals', async () => {
      const approvals = await inventoryApprovalService.getAll();

      expect(Array.isArray(approvals)).toBe(true);
    });
  });

  describe('getPending', () => {
    it('returns pending approvals', async () => {
      const pending = await inventoryApprovalService.getPending();

      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe('createRequest', () => {
    it('creates approval request', async () => {
      const response = await inventoryApprovalService.createRequest(mockRequest);

      expect(response.success).toBe(true);
      expect(response.approvalId).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('generates unique approval ID', async () => {
      const response1 = await inventoryApprovalService.createRequest(mockRequest);
      const response2 = await inventoryApprovalService.createRequest(mockRequest);

      expect(response1.approvalId).not.toBe(response2.approvalId);
    });
  });

  describe('approve', () => {
    it('approves an approval request', async () => {
      const approval = await inventoryApprovalService.approve('ia-1');

      expect(approval.id).toBe('ia-1');
      expect(approval.status).toBe('approved');
      expect(approval.approvedAt).toBeDefined();
    });
  });

  describe('reject', () => {
    it('rejects an approval request', async () => {
      const approval = await inventoryApprovalService.reject('ia-1', 'Not needed');

      expect(approval.id).toBe('ia-1');
      expect(approval.status).toBe('rejected');
      expect(approval.rejectionReason).toBe('Not needed');
      expect(approval.rejectedAt).toBeDefined();
    });

    it('rejects without reason', async () => {
      const approval = await inventoryApprovalService.reject('ia-1');

      expect(approval.status).toBe('rejected');
    });
  });
});

