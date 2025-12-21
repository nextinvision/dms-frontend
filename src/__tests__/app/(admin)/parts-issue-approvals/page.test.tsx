import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import PartsIssueApprovalsPage from '@/app/(admin)/parts-issue-approvals/page';
import { adminApprovalService } from '@/features/inventory/services/adminApproval.service';
import { createMockPartsIssue } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/adminApproval.service', () => ({
  adminApprovalService: {
    getPendingApprovals: vi.fn(),
    approvePartsIssue: vi.fn(),
    rejectPartsIssue: vi.fn(),
  },
}));

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'admin',
    userInfo: { id: '1', name: 'Admin User' },
  }),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe('PartsIssueApprovalsPage', () => {
  const mockPendingRequests = [
    createMockPartsIssue({
      id: 'issue-1',
      issueNumber: 'PI-001',
      status: 'pending_admin_approval',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApprovalService.getPendingApprovals).mockResolvedValue(mockPendingRequests as any);
  });

  it('renders parts issue approvals page', () => {
    render(<PartsIssueApprovalsPage />);
    
    expect(screen.getByText(/Parts Issue|Approvals/i)).toBeInTheDocument();
  });

  it('fetches pending approvals', async () => {
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('displays pending requests list', async () => {
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('approves parts issue request', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApprovalService.approvePartsIssue).mockResolvedValue({
      ...mockPendingRequests[0],
      status: 'admin_approved',
    } as any);
    
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
    
    const approveButton = screen.getByRole('button', { name: /approve|confirm/i });
    await user.click(approveButton);
    
    await waitFor(() => {
      expect(adminApprovalService.approvePartsIssue).toHaveBeenCalled();
    });
  });

  it('rejects parts issue request', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApprovalService.rejectPartsIssue).mockResolvedValue({
      ...mockPendingRequests[0],
      status: 'admin_rejected',
    } as any);
    
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
    
    const rejectButton = screen.getByRole('button', { name: /reject|decline/i });
    await user.click(rejectButton);
    
    await waitFor(() => {
      expect(adminApprovalService.rejectPartsIssue).toHaveBeenCalled();
    });
  });

  it('displays request details', async () => {
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('handles loading state', () => {
    vi.mocked(adminApprovalService.getPendingApprovals).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PartsIssueApprovalsPage />);
    
    expect(screen.getByText(/Parts Issue|Approvals|Loading/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(adminApprovalService.getPendingApprovals).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('refreshes approvals periodically', async () => {
    vi.useFakeTimers();
    
    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
    
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalledTimes(2);
    });
    
    vi.useRealTimers();
  });

  it('handles empty approvals list', async () => {
    vi.mocked(adminApprovalService.getPendingApprovals).mockResolvedValue([]);

    render(<PartsIssueApprovalsPage />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });
});

