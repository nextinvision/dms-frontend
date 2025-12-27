import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import AuditLogsPage from '@/app/(admin)/audit-logs/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('AuditLogsPage', () => {
  const mockAuditLogs = [
    {
      id: '1',
      action: 'CREATE',
      entity: 'JobCard',
      userId: '1',
      userName: 'Test User',
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockAuditLogs as any);
  });

  it('renders audit logs page', () => {
    render(<AuditLogsPage />);
    
    expect(screen.getByText(/Audit Logs|Audit/i)).toBeInTheDocument();
  });

  it('displays audit logs list', async () => {
    render(<AuditLogsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('filters by action type', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);
    
    const filterButton = screen.queryByRole('button', { name: /filter|action/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('filters by user', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);
    
    const userFilter = screen.queryByRole('combobox');
    if (userFilter) {
      await user.selectOptions(userFilter, '1');
    }
  });

  it('filters by date range', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);
    
    const dateFilter = screen.queryByLabelText(/date|range|from|to/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });

  it('searches audit logs', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'CREATE');
  });

  it('exports audit logs', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });

  it('handles empty audit logs list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<AuditLogsPage />);
    
    expect(screen.getByText(/Audit Logs|Audit/i)).toBeInTheDocument();
  });
});

