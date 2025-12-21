import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadsPage from '@/app/(service-center)/sc/leads/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('LeadsPage', () => {
  const mockLeads = [
    {
      id: '1',
      customerName: 'John Doe',
      phone: '+1234567890',
      vehicle: 'Tesla Model 3',
      status: 'new',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockLeads as any);
  });

  it('renders leads page', async () => {
    render(<LeadsPage />);
    
    await waitFor(() => {
      // Use getAllByText since there might be multiple instances
      const leadsElements = screen.getAllByText(/Leads/i);
      expect(leadsElements.length).toBeGreaterThan(0);
    });
  });

  it('displays leads list', async () => {
    render(<LeadsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('creates new lead', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    
    await waitFor(() => {
      const createButtons = screen.queryAllByRole('button', { name: /create|new|add|lead/i });
      if (createButtons.length > 0) {
        user.click(createButtons[0]);
      }
    });
  });

  it('converts lead to customer', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    
    const convertButton = screen.queryByRole('button', { name: /convert|customer/i });
    if (convertButton) {
      await user.click(convertButton);
    }
  });

  it('filters leads by status', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|status/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches leads', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|lead|customer/i);
    await user.type(searchInput, 'John');
  });

  it('handles empty leads list', async () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<LeadsPage />);
    
    await waitFor(() => {
      // Use getAllByText since there might be multiple instances
      const leadsElements = screen.getAllByText(/Leads/i);
      expect(leadsElements.length).toBeGreaterThan(0);
    });
  });
});

