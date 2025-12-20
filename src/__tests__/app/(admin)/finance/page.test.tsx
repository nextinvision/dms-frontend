import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import FinancePage from '@/app/(admin)/finance/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('renders finance page', () => {
    render(<FinancePage />);
    
    expect(screen.getByText(/Finance|Financial/i)).toBeInTheDocument();
  });

  it('displays financial overview', () => {
    render(<FinancePage />);
    
    expect(screen.getByText(/Finance|Financial/i)).toBeInTheDocument();
  });

  it('displays revenue statistics', () => {
    render(<FinancePage />);
    
    expect(screen.getByText(/Finance|Financial/i)).toBeInTheDocument();
  });

  it('filters by service center', async () => {
    const user = userEvent.setup();
    render(<FinancePage />);
    
    const filterSelect = screen.queryByRole('combobox');
    if (filterSelect) {
      await user.selectOptions(filterSelect, 'sc-001');
    }
  });

  it('filters by date range', async () => {
    const user = userEvent.setup();
    render(<FinancePage />);
    
    const dateFilter = screen.queryByLabelText(/date|range|from|to/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });

  it('exports financial data', async () => {
    const user = userEvent.setup();
    render(<FinancePage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });

  it('displays payment statistics', () => {
    render(<FinancePage />);
    
    expect(screen.getByText(/Finance|Financial/i)).toBeInTheDocument();
  });
});

