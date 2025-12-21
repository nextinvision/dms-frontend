import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventoryQuotationApproval } from '@/features/inventory/hooks/useInventoryQuotationApproval';
import { inventoryApprovalService } from '@/features/inventory/services/inventory-approval.service';
import type { InventoryApprovalRequest } from '@/features/inventory/services/inventory-approval.service';

// Mock dependencies
vi.mock('@/features/inventory/services/inventory-approval.service', () => ({
  inventoryApprovalService: {
    createRequest: vi.fn(),
    getAll: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    getPending: vi.fn(),
  },
}));

describe('useInventoryQuotationApproval', () => {
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

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useInventoryQuotationApproval());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates approval request successfully', async () => {
    vi.mocked(inventoryApprovalService.createRequest).mockResolvedValue({
      success: true,
      approvalId: 'ia-1',
      message: 'Created',
    });
    vi.mocked(inventoryApprovalService.getAll).mockResolvedValue([
      {
        id: 'ia-1',
        status: 'pending',
        items: mockRequest.items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as any);

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let approval: any = null;

    await act(async () => {
      approval = await result.current.createApprovalRequest(mockRequest);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(approval).toBeTruthy();
    expect(approval?.id).toBe('ia-1');
    expect(result.current.error).toBeNull();
  });

  it('handles approval request creation error', async () => {
    vi.mocked(inventoryApprovalService.createRequest).mockRejectedValue(
      new Error('Failed to create')
    );

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let approval: any = null;

    await act(async () => {
      approval = await result.current.createApprovalRequest(mockRequest);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(approval).toBeNull();
    expect(result.current.error).toBe('Failed to create');
  });

  it('approves request successfully', async () => {
    const mockApproval = {
      id: 'ia-1',
      status: 'approved',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    };
    vi.mocked(inventoryApprovalService.approve).mockResolvedValue(mockApproval as any);

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let approval: any = null;

    await act(async () => {
      approval = await result.current.approve('ia-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(approval).toEqual(mockApproval);
    expect(approval?.status).toBe('approved');
    expect(result.current.error).toBeNull();
  });

  it('rejects request successfully', async () => {
    const mockApproval = {
      id: 'ia-1',
      status: 'rejected',
      rejectionReason: 'Not needed',
      rejectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    };
    vi.mocked(inventoryApprovalService.reject).mockResolvedValue(mockApproval as any);

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let approval: any = null;

    await act(async () => {
      approval = await result.current.reject('ia-1', 'Not needed');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(approval).toEqual(mockApproval);
    expect(approval?.status).toBe('rejected');
    expect(approval?.rejectionReason).toBe('Not needed');
  });

  it('gets pending approvals', async () => {
    const mockPending = [
      {
        id: 'ia-1',
        status: 'pending',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    vi.mocked(inventoryApprovalService.getPending).mockResolvedValue(mockPending as any);

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let pending: any[] = [];

    await act(async () => {
      pending = await result.current.getPendingApprovals();
    });

    expect(pending).toEqual(mockPending);
    expect(inventoryApprovalService.getPending).toHaveBeenCalled();
  });

  it('handles getPendingApprovals error gracefully', async () => {
    vi.mocked(inventoryApprovalService.getPending).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useInventoryQuotationApproval());

    let pending: any[] = [];

    await act(async () => {
      pending = await result.current.getPendingApprovals();
    });

    expect(pending).toEqual([]);
  });

  it('sets loading state during operations', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(inventoryApprovalService.approve).mockReturnValue(promise as any);

    const { result } = renderHook(() => useInventoryQuotationApproval());

    act(() => {
      result.current.approve('ia-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolvePromise!({
      id: 'ia-1',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

