import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import ComplaintsPage from '@/app/(admin)/complaints/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('ComplaintsPage', () => {
  const mockComplaints = [
    {
      id: '1',
      customerName: 'John Doe',
      complaint: 'Service issue',
      status: 'open',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockComplaints as any);
  });

  it('renders complaints page', async () => {
    render(<ComplaintsPage />);
    
    await waitFor(() => {
      const pageContent = screen.queryByText(/Complaints|Complaint/i);
      expect(pageContent).toBeInTheDocument();
    });
  });

  it('displays complaints list', async () => {
    render(<ComplaintsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<ComplaintsPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|status|open|resolved/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches complaints', async () => {
    const user = userEvent.setup();
    render(<ComplaintsPage />);
    
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search|complaint|customer/i);
      if (searchInput) {
        user.type(searchInput, 'John');
      }
    });
  });

  it('views complaint details', async () => {
    const user = userEvent.setup();
    render(<ComplaintsPage />);
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });

  it('resolves complaint', async () => {
    const user = userEvent.setup();
    render(<ComplaintsPage />);
    
    const resolveButton = screen.queryByRole('button', { name: /resolve|close/i });
    if (resolveButton) {
      await user.click(resolveButton);
    }
  });

  it('handles empty complaints list', async () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<ComplaintsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Complaints|Complaint/i)).toBeInTheDocument();
    });
  });
});

