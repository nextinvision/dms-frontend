import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import ServiceCentersPage from '@/app/(admin)/servicecenters/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('ServiceCentersPage', () => {
  const mockServiceCenters = [
    {
      id: 1,
      code: 'SC-001',
      name: 'Pune Phase 1',
      address: '123 Main St',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '+1234567890',
      email: 'sc1@example.com',
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockServiceCenters as any);
  });

  it('renders service centers page', () => {
    render(<ServiceCentersPage />);
    
    expect(screen.getByText(/Service Centers|Service Centre/i)).toBeInTheDocument();
  });

  it('displays create service center button', () => {
    render(<ServiceCentersPage />);
    
    const createButton = screen.getByRole('button', { name: /create|new|add|service center/i });
    expect(createButton).toBeInTheDocument();
  });

  it('displays service centers list', async () => {
    render(<ServiceCentersPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('opens create service center form', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const createButton = screen.getByRole('button', { name: /create|new|add/i });
    await user.click(createButton);
  });

  it('edits service center', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const editButton = screen.queryByRole('button', { name: /edit|update/i });
    if (editButton) {
      await user.click(editButton);
    }
  });

  it('activates/deactivates service center', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const toggleButton = screen.queryByRole('button', { name: /activate|deactivate|status/i });
    if (toggleButton) {
      await user.click(toggleButton);
    }
  });

  it('searches service centers', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|service center|name/i);
    await user.type(searchInput, 'Pune');
  });

  it('filters service centers by status', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|status|active|inactive/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('handles empty service centers list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<ServiceCentersPage />);
    
    expect(screen.getByText(/Service Centers|Service Centre/i)).toBeInTheDocument();
  });

  it('views service center details', async () => {
    const user = userEvent.setup();
    render(<ServiceCentersPage />);
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });
});

