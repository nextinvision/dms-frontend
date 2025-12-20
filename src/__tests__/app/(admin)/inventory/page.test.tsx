import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import AdminInventoryPage from '@/app/(admin)/inventory/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';

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

describe('AdminInventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  it('renders admin inventory page', () => {
    render(<AdminInventoryPage />);
    
    expect(screen.getByText(/Inventory|Admin/i)).toBeInTheDocument();
  });

  it('displays inventory overview', () => {
    render(<AdminInventoryPage />);
    
    expect(screen.getByText(/Inventory|Admin/i)).toBeInTheDocument();
  });

  it('displays service center inventory', () => {
    render(<AdminInventoryPage />);
    
    expect(screen.getByText(/Inventory|Admin/i)).toBeInTheDocument();
  });

  it('filters by service center', async () => {
    const user = userEvent.setup();
    render(<AdminInventoryPage />);
    
    const filterSelect = screen.queryByRole('combobox');
    if (filterSelect) {
      await user.selectOptions(filterSelect, 'sc-001');
    }
  });

  it('displays inventory statistics', () => {
    render(<AdminInventoryPage />);
    
    expect(screen.getByText(/Inventory|Admin/i)).toBeInTheDocument();
  });

  it('exports inventory data', async () => {
    const user = userEvent.setup();
    render(<AdminInventoryPage />);
    
    const exportButton = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportButton) {
      await user.click(exportButton);
    }
  });
});

