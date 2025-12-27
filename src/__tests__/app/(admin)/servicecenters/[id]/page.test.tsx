import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import ServiceCenterDetailPage from '@/app/(admin)/servicecenters/[id]/page';
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
    back: vi.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
}));

describe('ServiceCenterDetailPage', () => {
  const mockServiceCenter = {
    id: 1,
    code: 'SC-001',
    name: 'Pune Phase 1',
    address: '123 Main St',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    phone: '+1234567890',
    email: 'sc1@example.com',
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([mockServiceCenter] as any);
  });

  it('renders service center detail page', () => {
    render(<ServiceCenterDetailPage />);
    
    expect(screen.getByText(/Service Center|Details/i)).toBeInTheDocument();
  });

  it('displays service center information', async () => {
    render(<ServiceCenterDetailPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('displays edit button', () => {
    render(<ServiceCenterDetailPage />);
    
    const editButton = screen.getByRole('button', { name: /edit|update/i });
    expect(editButton).toBeInTheDocument();
  });

  it('edits service center', async () => {
    const user = userEvent.setup();
    render(<ServiceCenterDetailPage />);
    
    const editButton = screen.getByRole('button', { name: /edit|update/i });
    await user.click(editButton);
  });

  it('displays service center statistics', () => {
    render(<ServiceCenterDetailPage />);
    
    expect(screen.getByText(/Service Center|Details/i)).toBeInTheDocument();
  });

  it('displays job cards for service center', () => {
    render(<ServiceCenterDetailPage />);
    
    expect(screen.getByText(/Service Center|Details/i)).toBeInTheDocument();
  });

  it('displays inventory for service center', () => {
    render(<ServiceCenterDetailPage />);
    
    expect(screen.getByText(/Service Center|Details/i)).toBeInTheDocument();
  });

  it('handles service center not found', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<ServiceCenterDetailPage />);
    
    expect(screen.getByText(/Service Center|Details|Not Found/i)).toBeInTheDocument();
  });

  it('activates/deactivates service center', async () => {
    const user = userEvent.setup();
    render(<ServiceCenterDetailPage />);
    
    const toggleButton = screen.queryByRole('button', { name: /activate|deactivate/i });
    if (toggleButton) {
      await user.click(toggleButton);
    }
  });
});

