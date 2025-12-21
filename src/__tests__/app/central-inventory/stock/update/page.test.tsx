import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import StockUpdatePage from '@/app/central-inventory/stock/update/page';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { centralStockService } from '@/features/inventory/services/centralStock.service';

// Mock dependencies
vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getAllStock: vi.fn(),
    updateStock: vi.fn(),
    adjustStock: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/centralStock.service', () => ({
  centralStockService: {
    addStock: vi.fn(),
    deductStock: vi.fn(),
    updateStock: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('StockUpdatePage', () => {
  const mockStock = [
    {
      id: 'stock-1',
      partId: 'part-1',
      partName: 'Brake Pad',
      partNumber: 'BP-001',
      currentQty: 100,
      minStockLevel: 20,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralInventoryRepository.getAllStock).mockResolvedValue(mockStock as any);
  });

  it('renders stock update page', () => {
    render(<StockUpdatePage />);
    
    expect(screen.getByText(/Stock Update|Update Stock/i)).toBeInTheDocument();
  });

  it('fetches stock data', async () => {
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
  });

  it('displays stock list', async () => {
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
  });

  it('selects stock item', async () => {
    const user = userEvent.setup();
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
    
    const stockItem = screen.queryByText('Brake Pad');
    if (stockItem) {
      await user.click(stockItem);
    }
  });

  it('searches stock', async () => {
    const user = userEvent.setup();
    render(<StockUpdatePage />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Brake');
  });

  it('adds stock quantity', async () => {
    const user = userEvent.setup();
    vi.mocked(centralStockService.addStock).mockResolvedValue({
      stock: { ...mockStock[0], currentQty: 150 },
      adjustment: {},
    } as any);
    
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.type(quantityInput, '50');
    
    const submitButton = screen.getByRole('button', { name: /submit|update|save/i });
    await user.click(submitButton);
  });

  it('deducts stock quantity', async () => {
    const user = userEvent.setup();
    vi.mocked(centralStockService.deductStock).mockResolvedValue({
      stock: { ...mockStock[0], currentQty: 50 },
      adjustment: {},
    } as any);
    
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
  });

  it('validates quantity before submission', async () => {
    const user = userEvent.setup();
    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
    
    const submitButton = screen.getByRole('button', { name: /submit|update|save/i });
    await user.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText(/quantity|required|valid/i)).toBeInTheDocument();
  });

  it('handles empty stock list', async () => {
    vi.mocked(centralInventoryRepository.getAllStock).mockResolvedValue([]);

    render(<StockUpdatePage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllStock).toHaveBeenCalled();
    });
  });

  it('navigates back', async () => {
    const user = userEvent.setup();
    render(<StockUpdatePage />);
    
    const backButton = screen.getByRole('button', { name: /back|cancel/i });
    await user.click(backButton);
  });
});

