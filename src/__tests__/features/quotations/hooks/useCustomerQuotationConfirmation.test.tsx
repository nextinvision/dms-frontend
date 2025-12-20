import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomerQuotationConfirmation } from '@/features/quotations/hooks/useCustomerQuotationConfirmation';
import { quotationsService } from '@/features/quotations/services/quotations.service';
import { createMockQuotation } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/quotations/services/quotations.service', () => ({
  quotationsService: {
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/inventory-approval.service', () => ({
  inventoryApprovalService: {
    createRequest: vi.fn(),
  },
}));

describe('useCustomerQuotationConfirmation', () => {
  const mockQuotation = createMockQuotation({
    id: 'q-1',
    quotationNumber: 'QUO-001',
    status: 'pending',
    items: [
      {
        partName: 'Brake Pad',
        partNumber: 'BP-001',
        quantity: 2,
        amount: 1000,
      },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('confirms quotation successfully', async () => {
    vi.mocked(quotationsService.updateStatus).mockResolvedValue({
      ...mockQuotation,
      status: 'customer_approved',
    } as any);

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    let confirmedQuotation: any = null;

    await act(async () => {
      confirmedQuotation = await result.current.confirmQuotation('q-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(quotationsService.updateStatus).toHaveBeenCalledWith(
      'q-1',
      'customer_approved'
    );
    expect(confirmedQuotation).toBeTruthy();
    expect(confirmedQuotation?.status).toBe('customer_approved');
    expect(result.current.error).toBeNull();
  });

  it('creates inventory approval request after confirmation', async () => {
    const { inventoryApprovalService } = await import(
      '@/features/inventory/services/inventory-approval.service'
    );

    vi.mocked(quotationsService.updateStatus).mockResolvedValue({
      ...mockQuotation,
      status: 'customer_approved',
    } as any);
    vi.mocked(inventoryApprovalService.createRequest).mockResolvedValue({
      id: 'req-1',
    } as any);

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    await act(async () => {
      await result.current.confirmQuotation('q-1');
    });

    await waitFor(() => {
      expect(inventoryApprovalService.createRequest).toHaveBeenCalled();
    });

    expect(inventoryApprovalService.createRequest).toHaveBeenCalledWith({
      quotationId: 'q-1',
      items: [
        {
          partName: 'Brake Pad',
          partNumber: 'BP-001',
          quantity: 2,
        },
      ],
      notes: expect.stringContaining('Auto-generated'),
    });
  });

  it('handles confirmation error gracefully', async () => {
    const errorMessage = 'Failed to confirm quotation';
    vi.mocked(quotationsService.updateStatus).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    let confirmedQuotation: any = null;

    await act(async () => {
      confirmedQuotation = await result.current.confirmQuotation('q-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(confirmedQuotation).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('does not fail if inventory approval request creation fails', async () => {
    const { inventoryApprovalService } = await import(
      '@/features/inventory/services/inventory-approval.service'
    );

    vi.mocked(quotationsService.updateStatus).mockResolvedValue({
      ...mockQuotation,
      status: 'customer_approved',
    } as any);
    vi.mocked(inventoryApprovalService.createRequest).mockRejectedValue(
      new Error('Inventory service error')
    );

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    let confirmedQuotation: any = null;

    await act(async () => {
      confirmedQuotation = await result.current.confirmQuotation('q-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Confirmation should still succeed even if inventory request fails
    expect(confirmedQuotation).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  it('rejects quotation successfully', async () => {
    vi.mocked(quotationsService.updateStatus).mockResolvedValue({
      ...mockQuotation,
      status: 'customer_rejected',
    } as any);

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    let rejectedQuotation: any = null;

    await act(async () => {
      rejectedQuotation = await result.current.rejectQuotation(
        'q-1',
        'Too expensive'
      );
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(quotationsService.updateStatus).toHaveBeenCalledWith(
      'q-1',
      'customer_rejected',
      'Too expensive'
    );
    expect(rejectedQuotation).toBeTruthy();
    expect(rejectedQuotation?.status).toBe('customer_rejected');
    expect(result.current.error).toBeNull();
  });

  it('handles rejection error gracefully', async () => {
    const errorMessage = 'Failed to reject quotation';
    vi.mocked(quotationsService.updateStatus).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    let rejectedQuotation: any = null;

    await act(async () => {
      rejectedQuotation = await result.current.rejectQuotation('q-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(rejectedQuotation).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('sets loading state during confirmation', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(quotationsService.updateStatus).mockReturnValue(promise as any);

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    act(() => {
      result.current.confirmQuotation('q-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolvePromise!({
      ...mockQuotation,
      status: 'customer_approved',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles quotation without items', async () => {
    const quotationWithoutItems = {
      ...mockQuotation,
      items: [],
    };

    vi.mocked(quotationsService.updateStatus).mockResolvedValue(
      quotationWithoutItems as any
    );

    const { result } = renderHook(() => useCustomerQuotationConfirmation());

    await act(async () => {
      await result.current.confirmQuotation('q-1');
    });

    // Should not create inventory approval request if no items
    const { inventoryApprovalService } = await import(
      '@/features/inventory/services/inventory-approval.service'
    );
    expect(inventoryApprovalService.createRequest).not.toHaveBeenCalled();
  });
});

