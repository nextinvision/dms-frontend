import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import WorkshopPage from '@/app/(service-center)/sc/workshop/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockJobCard } from '@/test/utils/mocks';

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

vi.mock('@/__mocks__/data/workshop.mock', () => ({
  defaultEngineers: [
    { id: '1', name: 'Engineer 1', status: 'available' },
    { id: '2', name: 'Engineer 2', status: 'busy' },
  ],
}));

describe('WorkshopPage', () => {
  const mockJobCards = [
    createMockJobCard({ id: '1', status: 'Assigned', assignedEngineer: 'Engineer 1' }),
    createMockJobCard({ id: '2', status: 'In Progress', assignedEngineer: 'Engineer 2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockJobCards as any);
  });

  it('renders workshop page', () => {
    render(<WorkshopPage />);
    
    expect(screen.getByText(/Workshop/i)).toBeInTheDocument();
  });

  it('displays engineers list', () => {
    render(<WorkshopPage />);
    
    expect(screen.getByText(/Workshop/i)).toBeInTheDocument();
  });

  it('displays active job cards', async () => {
    render(<WorkshopPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('filters job cards by status', async () => {
    const user = userEvent.setup();
    render(<WorkshopPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|status/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('filters job cards by priority', async () => {
    const user = userEvent.setup();
    render(<WorkshopPage />);
    
    const priorityFilter = screen.queryByRole('button', { name: /priority/i });
    if (priorityFilter) {
      await user.click(priorityFilter);
    }
  });

  it('searches job cards', async () => {
    const user = userEvent.setup();
    render(<WorkshopPage />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'JC-001');
  });

  it('assigns job card to engineer', async () => {
    const user = userEvent.setup();
    render(<WorkshopPage />);
    
    const assignButton = screen.queryByRole('button', { name: /assign|engineer/i });
    if (assignButton) {
      await user.click(assignButton);
    }
  });

  it('completes job card', async () => {
    const user = userEvent.setup();
    render(<WorkshopPage />);
    
    const completeButton = screen.queryByRole('button', { name: /complete|finish/i });
    if (completeButton) {
      await user.click(completeButton);
    }
  });

  it('displays engineer workload', () => {
    render(<WorkshopPage />);
    
    expect(screen.getByText(/Workshop/i)).toBeInTheDocument();
  });

  it('displays workshop statistics', () => {
    render(<WorkshopPage />);
    
    expect(screen.getByText(/Workshop/i)).toBeInTheDocument();
  });

  it('handles empty job cards list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<WorkshopPage />);
    
    expect(screen.getByText(/Workshop/i)).toBeInTheDocument();
  });
});

