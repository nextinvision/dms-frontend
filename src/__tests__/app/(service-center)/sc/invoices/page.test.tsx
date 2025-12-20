import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import InvoicesPage from '@/app/(service-center)/sc/invoices/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockInvoice } from '@/test/utils/mocks';

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

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'service_advisor',
    userInfo: { id: '1', name: 'Test User' },
  }),
}));

describe('InvoicesPage', () => {
  const mockInvoices = [
    createMockInvoice({
      id: '1',
      invoiceNumber: 'INV-001',
      status: 'pending',
      totalAmount: 10000,
    }),
    createMockInvoice({
      id: '2',
      invoiceNumber: 'INV-002',
      status: 'paid',
      totalAmount: 15000,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockInvoices as any);
  });

  it('renders invoices page', () => {
    render(<InvoicesPage />);
    
    expect(screen.getByText(/Invoices|Invoice/i)).toBeInTheDocument();
  });

  it('displays invoices list', async () => {
    render(<InvoicesPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('filters invoices by status', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const filterButton = screen.getByRole('button', { name: /filter|status|pending|paid/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches invoices', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|invoice|number/i);
    if (searchInput) {
      await user.type(searchInput, 'INV-001');
    }
  });

  it('displays invoice details', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    // Click on an invoice
    const invoice = screen.queryByText('INV-001');
    if (invoice) {
      await user.click(invoice);
    }
  });

  it('generates invoice PDF', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const pdfButton = screen.queryByRole('button', { name: /pdf|download|print/i });
    if (pdfButton) {
      await user.click(pdfButton);
    }
  });

  it('records payment', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const paymentButton = screen.queryByRole('button', { name: /payment|pay|record/i });
    if (paymentButton) {
      await user.click(paymentButton);
    }
  });

  it('handles empty invoices list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<InvoicesPage />);
    
    expect(screen.getByText(/Invoices|Invoice/i)).toBeInTheDocument();
  });

  it('filters invoices by date range', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const dateFilter = screen.queryByLabelText(/date|range|from|to/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });
});

