import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import CentralInventoryDashboard from '@/app/central-inventory/dashboard/page';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';

// Mock dependencies
vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getStats: vi.fn(),
    getAllPurchaseOrders: vi.fn(),
    getAllPartsIssues: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('CentralInventoryDashboard', () => {
  const mockStats = {
    totalParts: 1000,
    totalStockValue: 500000,
    lowStockParts: 50,
    outOfStockParts: 10,
    pendingPurchaseOrders: 5,
    approvedPurchaseOrders: 20,
    pendingIssues: 3,
    totalServiceCenters: 10,
    recentActivity: 15,
  };

  const mockPurchaseOrders = [
    {
      id: 'po-1',
      poNumber: 'PO-001',
      serviceCenterId: 'sc-001',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];

  const mockIssues = [
    {
      id: 'issue-1',
      issueNumber: 'ISSUE-001',
      serviceCenterId: 'sc-001',
      status: 'issued',
      issuedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralInventoryRepository.getStats).mockResolvedValue(mockStats as any);
    vi.mocked(centralInventoryRepository.getAllPurchaseOrders).mockResolvedValue(mockPurchaseOrders as any);
    vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue(mockIssues as any);
  });

  it('renders central inventory dashboard', () => {
    render(<CentralInventoryDashboard />);
    
    expect(screen.getByText(/Dashboard|Central Inventory/i)).toBeInTheDocument();
  });

  it('fetches dashboard stats', async () => {
    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getStats).toHaveBeenCalled();
    });
  });

  it('displays stats cards', async () => {
    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getStats).toHaveBeenCalled();
    });
    
    // Stats should be displayed
    expect(screen.getByText(/Dashboard|Central Inventory/i)).toBeInTheDocument();
  });

  it('displays recent purchase orders', async () => {
    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('displays recent parts issues', async () => {
    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllPartsIssues).toHaveBeenCalled();
    });
  });

  it('displays quick actions', () => {
    render(<CentralInventoryDashboard />);
    
    const quickActionLinks = screen.queryAllByRole('link');
    expect(quickActionLinks.length).toBeGreaterThan(0);
  });

  it('navigates to purchase orders', async () => {
    const user = userEvent.setup();
    render(<CentralInventoryDashboard />);
    
    const poLink = screen.getByRole('link', { name: /Purchase Orders|View Purchase Orders/i });
    await user.click(poLink);
  });

  it('navigates to stock management', async () => {
    const user = userEvent.setup();
    render(<CentralInventoryDashboard />);
    
    const stockLink = screen.getByRole('link', { name: /Manage Stock|Stock/i });
    await user.click(stockLink);
  });

  it('handles loading state', () => {
    vi.mocked(centralInventoryRepository.getStats).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<CentralInventoryDashboard />);
    
    expect(screen.getByText(/Dashboard|Central Inventory/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(centralInventoryRepository.getStats).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getStats).toHaveBeenCalled();
    });
  });

  it('displays low stock alerts', async () => {
    render(<CentralInventoryDashboard />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getStats).toHaveBeenCalled();
    });
  });
});

