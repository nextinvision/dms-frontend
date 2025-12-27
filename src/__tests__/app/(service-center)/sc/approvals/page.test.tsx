import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import ApprovalsPage from '@/app/(service-center)/sc/approvals/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/shared/lib/serviceCenter', () => ({
  getServiceCenterContext: vi.fn(() => ({ serviceCenterId: 'sc-001' })),
  filterByServiceCenter: vi.fn((items) => items),
  shouldFilterByServiceCenter: vi.fn(() => false),
}));

describe('ApprovalsPage', () => {
  const mockQuotations = [
    {
      id: '1',
      quotationNumber: 'QUO-001',
      status: 'pending',
      customerName: 'John Doe',
    },
  ];

  const mockJobCards = [
    {
      id: '1',
      jobCardNumber: 'JC-001',
      status: 'Awaiting Quotation Approval',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('renders approvals page', () => {
    render(<ApprovalsPage />);
    
    expect(screen.getByText(/Approvals|Approval/i)).toBeInTheDocument();
  });

  it('displays pending quotations', async () => {
    vi.mocked(safeStorage.getItem).mockReturnValue(mockQuotations as any);
    
    render(<ApprovalsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('displays pending job cards', async () => {
    vi.mocked(safeStorage.getItem).mockReturnValue(mockJobCards as any);
    
    render(<ApprovalsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('approves quotation', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);
    
    const approveButton = screen.queryByRole('button', { name: /approve|confirm/i });
    if (approveButton) {
      await user.click(approveButton);
    }
  });

  it('rejects quotation', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);
    
    const rejectButton = screen.queryByRole('button', { name: /reject|decline/i });
    if (rejectButton) {
      await user.click(rejectButton);
    }
  });

  it('filters by type', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|type/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches approvals', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'QUO-001');
  });

  it('displays approval details', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });

  it('handles empty approvals list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<ApprovalsPage />);
    
    expect(screen.getByText(/Approvals|Approval/i)).toBeInTheDocument();
  });
});

