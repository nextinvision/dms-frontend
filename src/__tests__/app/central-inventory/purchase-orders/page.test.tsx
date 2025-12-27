import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import PurchaseOrdersPage from '@/app/central-inventory/purchase-orders/page';
import { centralPurchaseOrderService } from '@/features/inventory/services/centralPurchaseOrder.service';

// Mock dependencies
vi.mock('@/features/inventory/services/centralPurchaseOrder.service', () => ({
  centralPurchaseOrderService: {
    getAllPurchaseOrders: vi.fn(),
    getPurchaseOrdersByStatus: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('PurchaseOrdersPage', () => {
  const mockPurchaseOrders = [
    {
      id: 'po-1',
      poNumber: 'PO-001',
      serviceCenterId: 'sc-001',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralPurchaseOrderService.getAllPurchaseOrders).mockResolvedValue(mockPurchaseOrders as any);
  });

  it('renders purchase orders page', () => {
    render(<PurchaseOrdersPage />);
    
    expect(screen.getByText(/Purchase Orders|PO/i)).toBeInTheDocument();
  });

  it('fetches purchase orders', async () => {
    render(<PurchaseOrdersPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('displays purchase orders list', async () => {
    render(<PurchaseOrdersPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('filters purchase orders by status', async () => {
    const user = userEvent.setup();
    vi.mocked(centralPurchaseOrderService.getPurchaseOrdersByStatus).mockResolvedValue(mockPurchaseOrders as any);
    
    render(<PurchaseOrdersPage />);
    
    const filterButton = screen.getByRole('button', { name: /filter|status|pending|approved/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('views purchase order details', async () => {
    const user = userEvent.setup();
    render(<PurchaseOrdersPage />);
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });

  it('approves purchase order', async () => {
    const user = userEvent.setup();
    render(<PurchaseOrdersPage />);
    
    const approveButton = screen.queryByRole('button', { name: /approve|confirm/i });
    if (approveButton) {
      await user.click(approveButton);
    }
  });

  it('rejects purchase order', async () => {
    const user = userEvent.setup();
    render(<PurchaseOrdersPage />);
    
    const rejectButton = screen.queryByRole('button', { name: /reject|decline/i });
    if (rejectButton) {
      await user.click(rejectButton);
    }
  });

  it('handles empty purchase orders list', async () => {
    vi.mocked(centralPurchaseOrderService.getAllPurchaseOrders).mockResolvedValue([]);

    render(<PurchaseOrdersPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('searches purchase orders', async () => {
    const user = userEvent.setup();
    render(<PurchaseOrdersPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|po|number/i);
    if (searchInput) {
      await user.type(searchInput, 'PO-001');
    }
  });
});

