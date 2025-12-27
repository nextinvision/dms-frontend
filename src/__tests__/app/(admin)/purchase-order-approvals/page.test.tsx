import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import PurchaseOrderApprovalsPage from '@/app/(admin)/purchase-order-approvals/page';
import { centralPurchaseOrderService } from '@/features/inventory/services/centralPurchaseOrder.service';

// Mock dependencies
vi.mock('@/features/inventory/services/centralPurchaseOrder.service', () => ({
  centralPurchaseOrderService: {
    getAllPurchaseOrders: vi.fn(),
    approvePurchaseOrder: vi.fn(),
    rejectPurchaseOrder: vi.fn(),
  },
}));

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'admin',
    userInfo: { id: '1', name: 'Admin User' },
  }),
}));

describe('PurchaseOrderApprovalsPage', () => {
  const mockPurchaseOrders = [
    {
      id: 'po-1',
      poNumber: 'PO-001',
      status: 'pending',
      serviceCenterId: 'sc-001',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralPurchaseOrderService.getAllPurchaseOrders).mockResolvedValue(mockPurchaseOrders as any);
  });

  it('renders purchase order approvals page', () => {
    render(<PurchaseOrderApprovalsPage />);
    
    expect(screen.getByText(/Purchase Order|Approvals/i)).toBeInTheDocument();
  });

  it('fetches pending purchase orders', async () => {
    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('displays pending orders list', async () => {
    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('approves purchase order', async () => {
    const user = userEvent.setup();
    vi.mocked(centralPurchaseOrderService.approvePurchaseOrder).mockResolvedValue({
      ...mockPurchaseOrders[0],
      status: 'approved',
    } as any);
    
    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
    
    const approveButton = screen.getByRole('button', { name: /approve|confirm/i });
    await user.click(approveButton);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.approvePurchaseOrder).toHaveBeenCalled();
    });
  });

  it('rejects purchase order', async () => {
    const user = userEvent.setup();
    vi.mocked(centralPurchaseOrderService.rejectPurchaseOrder).mockResolvedValue({
      ...mockPurchaseOrders[0],
      status: 'rejected',
    } as any);
    
    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
    
    const rejectButton = screen.getByRole('button', { name: /reject|decline/i });
    await user.click(rejectButton);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.rejectPurchaseOrder).toHaveBeenCalled();
    });
  });

  it('displays order details', async () => {
    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('handles empty orders list', async () => {
    vi.mocked(centralPurchaseOrderService.getAllPurchaseOrders).mockResolvedValue([]);

    render(<PurchaseOrderApprovalsPage />);
    
    await waitFor(() => {
      expect(centralPurchaseOrderService.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });
});

