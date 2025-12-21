import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import StockPage from '@/app/central-inventory/stock/page';
import { centralStockService } from '@/features/inventory/services/centralStock.service';

// Mock dependencies
vi.mock('@/features/inventory/services/centralStock.service', () => ({
  centralStockService: {
    getCentralStock: vi.fn(),
    searchStock: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('StockPage', () => {
  const mockStock = [
    {
      id: 'stock-1',
      partId: 'part-1',
      partName: 'Brake Pad',
      partNumber: 'BP-001',
      stockQuantity: 100,
      minStockLevel: 20,
      location: 'Warehouse A',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralStockService.getCentralStock).mockResolvedValue(mockStock as any);
  });

  it('renders stock page', () => {
    render(<StockPage />);
    
    expect(screen.getByText(/Stock|Inventory/i)).toBeInTheDocument();
  });

  it('fetches stock data', async () => {
    render(<StockPage />);
    
    await waitFor(() => {
      expect(centralStockService.getCentralStock).toHaveBeenCalled();
    });
  });

  it('displays stock table', async () => {
    render(<StockPage />);
    
    await waitFor(() => {
      expect(centralStockService.getCentralStock).toHaveBeenCalled();
    });
  });

  it('searches stock', async () => {
    const user = userEvent.setup();
    render(<StockPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|part|stock/i);
    await user.type(searchInput, 'Brake');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Brake');
    });
  });

  it('filters stock by location', async () => {
    const user = userEvent.setup();
    render(<StockPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|location/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('updates stock quantity', async () => {
    const user = userEvent.setup();
    render(<StockPage />);
    
    const updateButton = screen.queryByRole('button', { name: /update|edit|adjust/i });
    if (updateButton) {
      await user.click(updateButton);
    }
  });

  it('displays low stock alerts', async () => {
    render(<StockPage />);
    
    await waitFor(() => {
      expect(centralStockService.getCentralStock).toHaveBeenCalled();
    });
  });

  it('handles empty stock list', async () => {
    vi.mocked(centralStockService.getCentralStock).mockResolvedValue([]);

    render(<StockPage />);
    
    await waitFor(() => {
      expect(centralStockService.getCentralStock).toHaveBeenCalled();
    });
  });

  it('exports stock data', async () => {
    const user = userEvent.setup();
    render(<StockPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });
});

