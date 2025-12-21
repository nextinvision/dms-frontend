import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import IssuePartsPage from '@/app/central-inventory/stock/issue/page';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';

// Mock dependencies
vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getAllServiceCenters: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('IssuePartsPage', () => {
  const mockServiceCenters = [
    {
      id: 'sc-001',
      name: 'Service Center 1',
      location: 'Pune',
      active: true,
    },
    {
      id: 'sc-002',
      name: 'Service Center 2',
      location: 'Mumbai',
      active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockResolvedValue(mockServiceCenters as any);
  });

  it('renders issue parts page', () => {
    render(<IssuePartsPage />);
    
    expect(screen.getByText(/Issue Parts/i)).toBeInTheDocument();
  });

  it('fetches service centers', async () => {
    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
  });

  it('displays service centers list', async () => {
    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
    
    expect(screen.getByText('Service Center 1')).toBeInTheDocument();
    expect(screen.getByText('Service Center 2')).toBeInTheDocument();
  });

  it('searches service centers', async () => {
    const user = userEvent.setup();
    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByPlaceholderText(/search|service center/i);
    await user.type(searchInput, 'Pune');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Pune');
    });
  });

  it('selects service center', async () => {
    const user = userEvent.setup();
    const mockPush = vi.fn();
    vi.mocked(require('next/navigation').useRouter).mockReturnValue({
      push: mockPush,
    } as any);
    
    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
    
    const serviceCenter = screen.getByText('Service Center 1');
    await user.click(serviceCenter);
    
    expect(mockPush).toHaveBeenCalledWith('/central-inventory/stock/issue/sc-001');
  });

  it('filters only active service centers', async () => {
    const inactiveCenters = [
      ...mockServiceCenters,
      {
        id: 'sc-003',
        name: 'Inactive Center',
        location: 'Delhi',
        active: false,
      },
    ];
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockResolvedValue(inactiveCenters as any);
    
    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
    
    expect(screen.queryByText('Inactive Center')).not.toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<IssuePartsPage />);
    
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('handles empty service centers list', async () => {
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockResolvedValue([]);

    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
    
    expect(screen.getByText(/No service centers found/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<IssuePartsPage />);
    
    await waitFor(() => {
      expect(centralInventoryRepository.getAllServiceCenters).toHaveBeenCalled();
    });
  });
});

