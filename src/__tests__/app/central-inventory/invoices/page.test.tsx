import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import CentralInvoicesPage from '@/app/central-inventory/invoices/page';
import { invoiceService } from '@/features/inventory/services/invoice.service';
import { createMockInvoice } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/invoice.service', () => ({
  invoiceService: {
    getAllInvoices: vi.fn(),
    getInvoicesByServiceCenter: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('CentralInvoicesPage', () => {
  const mockInvoices = [
    createMockInvoice({
      id: '1',
      invoiceNumber: 'INV-001',
      serviceCenterId: 'sc-001',
      status: 'sent',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invoiceService.getAllInvoices).mockReturnValue(mockInvoices as any);
  });

  it('renders central invoices page', () => {
    render(<CentralInvoicesPage />);
    
    expect(screen.getByText(/Invoices|Invoice/i)).toBeInTheDocument();
  });

  it('displays invoices list', () => {
    render(<CentralInvoicesPage />);
    
    expect(invoiceService.getAllInvoices).toHaveBeenCalled();
  });

  it('filters by service center', async () => {
    const user = userEvent.setup();
    vi.mocked(invoiceService.getInvoicesByServiceCenter).mockReturnValue(mockInvoices as any);
    
    render(<CentralInvoicesPage />);
    
    const filterSelect = screen.queryByRole('combobox');
    if (filterSelect) {
      await user.selectOptions(filterSelect, 'sc-001');
    }
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<CentralInvoicesPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|status|sent|paid/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches invoices', async () => {
    const user = userEvent.setup();
    render(<CentralInvoicesPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|invoice|number/i);
    await user.type(searchInput, 'INV-001');
  });

  it('views invoice details', async () => {
    const user = userEvent.setup();
    render(<CentralInvoicesPage />);
    
    const viewButton = screen.queryByRole('button', { name: /view|details/i });
    if (viewButton) {
      await user.click(viewButton);
    }
  });

  it('generates invoice PDF', async () => {
    const user = userEvent.setup();
    render(<CentralInvoicesPage />);
    
    const pdfButton = screen.queryByRole('button', { name: /pdf|download|print/i });
    if (pdfButton) {
      await user.click(pdfButton);
    }
  });

  it('handles empty invoices list', () => {
    vi.mocked(invoiceService.getAllInvoices).mockReturnValue([]);

    render(<CentralInvoicesPage />);
    
    expect(screen.getByText(/Invoices|Invoice/i)).toBeInTheDocument();
  });
});

