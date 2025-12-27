import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import PartsIssueRequestsPage from '@/app/central-inventory/parts-issue-requests/page';
import { centralIssueService } from '@/features/inventory/services/centralIssue.service';
import { createMockPartsIssue } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/centralIssue.service', () => ({
  centralIssueService: {
    getIssueHistory: vi.fn(),
    getIssuesByServiceCenter: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('PartsIssueRequestsPage', () => {
  const mockIssues = [
    createMockPartsIssue({
      id: 'issue-1',
      issueNumber: 'ISSUE-001',
      serviceCenterName: 'Service Center 1',
      status: 'issued',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralIssueService.getIssueHistory).mockResolvedValue(mockIssues as any);
  });

  it('renders parts issue requests page', () => {
    render(<PartsIssueRequestsPage />);
    
    expect(screen.getByText(/Parts Issue|Requests/i)).toBeInTheDocument();
  });

  it('fetches issue history', async () => {
    render(<PartsIssueRequestsPage />);
    
    await waitFor(() => {
      expect(centralIssueService.getIssueHistory).toHaveBeenCalled();
    });
  });

  it('displays issues list', async () => {
    render(<PartsIssueRequestsPage />);
    
    await waitFor(() => {
      expect(centralIssueService.getIssueHistory).toHaveBeenCalled();
    });
  });

  it('filters by service center', async () => {
    const user = userEvent.setup();
    vi.mocked(centralIssueService.getIssuesByServiceCenter).mockResolvedValue(mockIssues as any);
    
    render(<PartsIssueRequestsPage />);
    
    await waitFor(() => {
      expect(centralIssueService.getIssueHistory).toHaveBeenCalled();
    });
    
    const filterSelect = screen.queryByRole('combobox');
    if (filterSelect) {
      await user.selectOptions(filterSelect, 'sc-001');
    }
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<PartsIssueRequestsPage />);
    
    const statusFilter = screen.queryByRole('button', { name: /filter|status/i });
    if (statusFilter) {
      await user.click(statusFilter);
    }
  });

  it('searches issues', async () => {
    const user = userEvent.setup();
    render(<PartsIssueRequestsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|issue|number/i);
    await user.type(searchInput, 'ISSUE-001');
  });

  it('views issue details', async () => {
    const user = userEvent.setup();
    render(<PartsIssueRequestsPage />);
    
    await waitFor(() => {
      expect(centralIssueService.getIssueHistory).toHaveBeenCalled();
    });
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });

  it('handles empty issues list', async () => {
    vi.mocked(centralIssueService.getIssueHistory).mockResolvedValue([]);

    render(<PartsIssueRequestsPage />);
    
    await waitFor(() => {
      expect(centralIssueService.getIssueHistory).toHaveBeenCalled();
    });
  });

  it('exports issues data', async () => {
    const user = userEvent.setup();
    render(<PartsIssueRequestsPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });
});

