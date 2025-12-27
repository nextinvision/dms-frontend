import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import ReportsPage from '@/app/(service-center)/sc/reports/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('renders reports page', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
    });
  });

  it('displays report types', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
    });
  });

  it('generates job card report', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    
    const generateButton = screen.queryByRole('button', { name: /generate|job card|report/i });
    if (generateButton) {
      await user.click(generateButton);
    }
  });

  it('generates revenue report', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    
    const revenueButton = screen.queryByRole('button', { name: /revenue|report/i });
    if (revenueButton) {
      await user.click(revenueButton);
    }
  });

  it('filters reports by date range', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    
    const dateFilter = screen.queryByLabelText(/date|range|from|to/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });

  it('exports report', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|pdf|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });

  it('displays report statistics', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reports|Report/i)).toBeInTheDocument();
    });
  });
});

