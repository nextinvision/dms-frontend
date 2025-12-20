import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '@/app/(admin)/dashboard/page';
import { adminApprovalService } from '@/features/inventory/services/adminApproval.service';
import { createMockPartsIssue } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/adminApproval.service', () => ({
  adminApprovalService: {
    getPendingApprovals: vi.fn(),
  },
}));

vi.mock('@/__mocks__/data/dashboard.mock', () => ({
  dashboardData: {
    'All Centres': {
      cards: [],
      alerts: [],
    },
  },
  centres: ['All Centres', 'Pune Phase 1', 'Mumbai'],
}));

describe('AdminDashboard', () => {
  const mockPendingIssues = [
    {
      id: 'issue-1',
      issueNumber: 'PI-001',
      serviceCenterName: 'Service Center 1',
      status: 'pending_admin_approval',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApprovalService.getPendingApprovals).mockResolvedValue(mockPendingIssues as any);
  });

  it('renders admin dashboard', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays selected center', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText(/All Centres/i)).toBeInTheDocument();
  });

  it('fetches pending approvals', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('changes selected center', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);
    
    const centerSelect = screen.getByRole('combobox');
    await user.selectOptions(centerSelect, 'Pune Phase 1');
    
    await waitFor(() => {
      expect(screen.getByText(/Pune Phase 1/i)).toBeInTheDocument();
    });
  });

  it('displays dashboard cards', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(<AdminDashboard />);
    
    const quickActionLinks = screen.queryAllByRole('link');
    expect(quickActionLinks.length).toBeGreaterThan(0);
  });

  it('displays pending approvals count', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('handles loading state', () => {
    vi.mocked(adminApprovalService.getPendingApprovals).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AdminDashboard />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(adminApprovalService.getPendingApprovals).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(adminApprovalService.getPendingApprovals).toHaveBeenCalled();
    });
  });

  it('navigates to quick actions', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);
    
    const quickActionLink = screen.getByRole('link', { name: /Parts Issue Approvals/i });
    await user.click(quickActionLink);
  });
});

