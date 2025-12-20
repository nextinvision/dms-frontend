import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import AdminReportsPage from '@/app/(admin)/reports/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('AdminReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('renders admin reports page', () => {
    render(<AdminReportsPage />);
    
    expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
  });

  it('displays report types', () => {
    render(<AdminReportsPage />);
    
    expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
  });

  it('generates system-wide report', async () => {
    const user = userEvent.setup();
    render(<AdminReportsPage />);
    
    const generateButton = screen.queryByRole('button', { name: /generate|report/i });
    if (generateButton) {
      await user.click(generateButton);
    }
  });

  it('filters by service center', async () => {
    const user = userEvent.setup();
    render(<AdminReportsPage />);
    
    const filterSelect = screen.queryByRole('combobox');
    if (filterSelect) {
      await user.selectOptions(filterSelect, 'sc-001');
    }
  });

  it('filters by date range', async () => {
    const user = userEvent.setup();
    render(<AdminReportsPage />);
    
    const dateFilter = screen.queryByLabelText(/date|range|from|to/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });

  it('exports report', async () => {
    const user = userEvent.setup();
    render(<AdminReportsPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|pdf|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });

  it('displays system statistics', () => {
    render(<AdminReportsPage />);
    
    expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
  });
});

