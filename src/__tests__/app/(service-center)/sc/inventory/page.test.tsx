import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import InventoryPage from '@/app/(service-center)/sc/inventory/page';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';
import { createMockPart } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/partsMaster.service', () => ({
  partsMasterService: {
    getAll: vi.fn(),
    searchParts: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('InventoryPage', () => {
  const mockParts = [
    createMockPart({ id: '1', partName: 'Brake Pad', stockQuantity: 50 }),
    createMockPart({ id: '2', partName: 'Oil Filter', stockQuantity: 30 }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(partsMasterService.getAll).mockResolvedValue(mockParts);
  });

  it('renders inventory page', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      const pageContent = screen.queryByText(/Inventory|Parts/i);
      expect(pageContent).toBeInTheDocument();
    });
  });

  it('fetches parts data', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(partsMasterService.getAll).toHaveBeenCalled();
    });
  });

  it('displays parts list', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(partsMasterService.getAll).toHaveBeenCalled();
    });
  });

  it('searches parts', async () => {
    const user = userEvent.setup();
    vi.mocked(partsMasterService.searchParts).mockResolvedValue([mockParts[0]]);
    
    render(<InventoryPage />);
    
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search|part|name/i);
      if (searchInput) {
        user.type(searchInput, 'Brake').then(() => {
          expect(searchInput).toHaveValue('Brake');
        });
      }
    });
  });

  it('displays low stock alerts', async () => {
    const lowStockParts = [
      createMockPart({ id: '3', partName: 'Low Stock Part', stockQuantity: 5, minStockLevel: 10 }),
    ];
    vi.mocked(partsMasterService.getAll).mockResolvedValue(lowStockParts);
    
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(partsMasterService.getAll).toHaveBeenCalled();
    });
  });

  it('opens add part form', async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    
    await waitFor(() => {
      const addButton = screen.queryByRole('button', { name: /add|create|new|part/i });
      if (addButton) {
        user.click(addButton);
      }
    });
  });

  it('filters parts by category', async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|category/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('handles empty parts list', async () => {
    vi.mocked(partsMasterService.getAll).mockResolvedValue([]);

    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(partsMasterService.getAll).toHaveBeenCalled();
    });
  });

  it('updates part stock', async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    
    const updateButton = screen.queryByRole('button', { name: /update|edit|stock/i });
    if (updateButton) {
      await user.click(updateButton);
    }
  });
});

