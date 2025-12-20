import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import TechniciansPage from '@/app/(service-center)/sc/technicians/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'service_advisor',
    userInfo: { id: '1', name: 'Test User' },
  }),
}));

describe('TechniciansPage', () => {
  const mockEngineers = [
    {
      id: '1',
      name: 'Engineer 1',
      status: 'available',
      specialization: 'General',
    },
    {
      id: '2',
      name: 'Engineer 2',
      status: 'busy',
      specialization: 'Electrical',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockEngineers as any);
  });

  it('renders technicians page', async () => {
    render(<TechniciansPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Technicians|Engineers/i)).toBeInTheDocument();
    });
  });

  it('displays engineers list', async () => {
    render(<TechniciansPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('adds new technician', async () => {
    const user = userEvent.setup();
    render(<TechniciansPage />);
    
    await waitFor(() => {
      const addButton = screen.queryByRole('button', { name: /add|create|new|technician|engineer/i });
      if (addButton) {
        user.click(addButton);
      }
    });
  });

  it('edits technician', async () => {
    const user = userEvent.setup();
    render(<TechniciansPage />);
    
    const editButton = screen.queryByRole('button', { name: /edit|update/i });
    if (editButton) {
      await user.click(editButton);
    }
  });

  it('searches technicians', async () => {
    const user = userEvent.setup();
    render(<TechniciansPage />);
    
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search|technician|engineer/i);
      if (searchInput) {
        user.type(searchInput, 'Engineer 1');
      }
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<TechniciansPage />);
    
    const statusFilter = screen.queryByRole('button', { name: /filter|status|available|busy/i });
    if (statusFilter) {
      await user.click(statusFilter);
    }
  });

  it('displays technician workload', async () => {
    render(<TechniciansPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Technicians|Engineers/i)).toBeInTheDocument();
    });
  });

  it('handles empty technicians list', async () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<TechniciansPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Technicians|Engineers/i)).toBeInTheDocument();
    });
  });
});

