import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobCardActions } from '@/features/job-cards/hooks/useJobCardActions';
import { createMockJobCard, createMockEngineer } from '@/test/utils/mocks';
import type { JobCard } from '@/shared/types/job-card.types';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/store/toastStore', () => ({
  useToastStore: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

vi.mock('@/features/workshop/services/staff.service', () => ({
  staffService: {
    getEngineers: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/jobCardPartsRequest.service', () => ({
  jobCardPartsRequestService: {
    createRequestFromJobCard: vi.fn(),
    approveByScManager: vi.fn(),
    assignPartsByInventoryManager: vi.fn(),
  },
}));

vi.mock('@/shared/lib/serviceCenter', () => ({
  getServiceCenterContext: vi.fn(() => ({
    serviceCenterId: '1',
    serviceCenterName: 'Test Service Center',
    userRole: 'service_advisor',
  })),
}));

vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/shared/utils/invoice.utils', () => ({
  generateInvoiceNumber: vi.fn(() => 'INV-001'),
  populateInvoiceFromJobCard: vi.fn(() => ({
    customerName: 'Test Customer',
    vehicle: 'Test Vehicle',
    amount: '1000',
    items: [],
  })),
}));

import { staffService } from '@/features/workshop/services/staff.service';
import { jobCardPartsRequestService } from '@/features/inventory/services/jobCardPartsRequest.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

describe('useJobCardActions', () => {
  const mockJobCards = [
    createMockJobCard({ id: '1', status: 'Created' }),
    createMockJobCard({ id: '2', status: 'Assigned' }),
  ];
  const mockSetJobCards = vi.fn();
  const mockUserInfo = { name: 'Test User', id: 'user1' };
  const mockEngineers = [
    createMockEngineer({ id: '1', name: 'Engineer 1' }),
    createMockEngineer({ id: '2', name: 'Engineer 2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(staffService.getEngineers).mockResolvedValue(mockEngineers);
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    expect(result.current.selectedJob).toBeNull();
    expect(result.current.showDetails).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.engineers).toEqual([]);
  });

  it('fetches engineers on mount', async () => {
    renderHook(() => useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo));

    await waitFor(() => {
      expect(staffService.getEngineers).toHaveBeenCalled();
    });
  });

  it('handles job card creation', () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    const newJobCard = createMockJobCard({ id: '3', status: 'Created' });

    act(() => {
      result.current.handleJobCardCreated(newJobCard);
    });

    expect(mockSetJobCards).toHaveBeenCalled();
    expect(result.current.showCreateModal).toBe(false);
  });

  it('assigns engineer to job card', async () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    await waitFor(() => {
      expect(result.current.engineers.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setAssigningJobId('1');
      result.current.setSelectedEngineer('1');
    });

    await act(async () => {
      await result.current.assignEngineer('1', '1');
    });

    expect(mockSetJobCards).toHaveBeenCalled();
    expect(result.current.showAssignEngineerModal).toBe(false);
  });

  it('updates job card status', async () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    await act(async () => {
      await result.current.updateStatus('1', 'In Progress');
    });

    expect(mockSetJobCards).toHaveBeenCalled();
    expect(safeStorage.setItem).toHaveBeenCalled();
  });

  it('handles status update to Completed', async () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    await act(async () => {
      await result.current.updateStatus('1', 'Completed');
    });

    expect(mockSetJobCards).toHaveBeenCalled();
    expect(safeStorage.setItem).toHaveBeenCalled();
  });

  it('handles part request submission', async () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    const mockRequest = {
      id: 'req-1',
      jobCardId: '1',
      status: 'pending',
      parts: [],
    };

    vi.mocked(jobCardPartsRequestService.createRequestFromJobCard).mockResolvedValue(mockRequest as any);

    act(() => {
      result.current.setSelectedJobCardForRequest('1');
    });

    await act(async () => {
      await result.current.handlePartRequestSubmit(
        mockJobCards,
        '1',
        [{ partName: 'Brake Pad', partCode: 'BP-001', qty: 2, amount: 1000 }]
      );
    });

    expect(jobCardPartsRequestService.createRequestFromJobCard).toHaveBeenCalled();
  });

  it('handles service manager part approval', async () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    const mockRequest = {
      id: 'req-1',
      jobCardId: '1',
      status: 'pending',
    };

    vi.mocked(jobCardPartsRequestService.approveByScManager).mockResolvedValue(mockRequest as any);

    act(() => {
      result.current.setSelectedJob(mockJobCards[0]);
      result.current.setPartsRequestsData({ '1': mockRequest });
    });

    await act(async () => {
      await result.current.handleServiceManagerPartApproval(false);
    });

    expect(jobCardPartsRequestService.approveByScManager).toHaveBeenCalled();
  });

  it('handles work completion notification', () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    act(() => {
      result.current.setSelectedJob(mockJobCards[0]);
    });

    act(() => {
      result.current.handleWorkCompletionNotification('1');
    });

    expect(mockSetJobCards).toHaveBeenCalled();
    expect(result.current.workCompletion['1']).toBe(true);
  });

  it('handles invoice creation', () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    const completedJob = createMockJobCard({ id: '1', status: 'Completed' });

    act(() => {
      result.current.setSelectedJob(completedJob);
    });

    act(() => {
      result.current.handleCreateInvoice();
    });

    expect(safeStorage.setItem).toHaveBeenCalled();
    expect(mockSetJobCards).toHaveBeenCalled();
  });

  it('prevents invoice creation for non-completed job', () => {
    const { result } = renderHook(() =>
      useJobCardActions(mockJobCards, mockSetJobCards, mockUserInfo)
    );

    act(() => {
      result.current.setSelectedJob(mockJobCards[0]); // Status: Created
    });

    act(() => {
      result.current.handleCreateInvoice();
    });

    // Should show warning, not create invoice
    expect(safeStorage.setItem).not.toHaveBeenCalledWith('invoices', expect.anything());
  });
});

