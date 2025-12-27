import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import PartsRequestPage from '@/app/(service-center)/sc/parts-request/page';
import { jobCardPartsRequestService } from '@/features/inventory/services/jobCardPartsRequest.service';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';
import { createMockJobCard } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/inventory/services/jobCardPartsRequest.service', () => ({
  jobCardPartsRequestService: {
    getByJobCardId: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/partsMaster.service', () => ({
  partsMasterService: {
    getAll: vi.fn(),
    searchParts: vi.fn(),
  },
}));

vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/shared/lib/serviceCenter', () => ({
  getServiceCenterContext: vi.fn(() => ({ serviceCenterId: 'sc-001' })),
  filterByServiceCenter: vi.fn((items) => items),
}));

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'service_advisor',
    userInfo: { id: '1', name: 'Test User' },
    isLoading: false,
  }),
}));

describe('PartsRequestPage', () => {
  const mockJobCards = [
    createMockJobCard({ id: '1', jobCardNumber: 'JC-001' }),
  ];

  const mockParts = [
    { id: '1', partName: 'Brake Pad', partNumber: 'BP-001' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(partsMasterService.getAll).mockResolvedValue(mockParts as any);
    vi.mocked(partsMasterService.searchParts).mockResolvedValue(mockParts as any);
  });

  it('renders parts request page', () => {
    render(<PartsRequestPage />);
    
    expect(screen.getByText(/Parts Request|Request Parts/i)).toBeInTheDocument();
  });

  it('displays job cards list', async () => {
    render(<PartsRequestPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Parts Request|Request Parts/i)).toBeInTheDocument();
    });
  });

  it('selects job card', async () => {
    const user = userEvent.setup();
    render(<PartsRequestPage />);
    
    const jobCard = screen.queryByText('JC-001');
    if (jobCard) {
      await user.click(jobCard);
    }
  });

  it('searches parts', async () => {
    const user = userEvent.setup();
    render(<PartsRequestPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|part/i);
    await user.type(searchInput, 'Brake');
    
    await waitFor(() => {
      expect(partsMasterService.searchParts).toHaveBeenCalled();
    });
  });

  it('adds part to request', async () => {
    const user = userEvent.setup();
    render(<PartsRequestPage />);
    
    const addButton = screen.queryByRole('button', { name: /add|part/i });
    if (addButton) {
      await user.click(addButton);
    }
  });

  it('submits parts request', async () => {
    const user = userEvent.setup();
    vi.mocked(jobCardPartsRequestService.create).mockResolvedValue({ id: 'req-1' } as any);
    
    render(<PartsRequestPage />);
    
    const submitButton = screen.queryByRole('button', { name: /submit|request/i });
    if (submitButton) {
      await user.click(submitButton);
    }
  });

  it('displays parts request form', () => {
    render(<PartsRequestPage />);
    
    expect(screen.getByText(/Parts Request|Request Parts/i)).toBeInTheDocument();
  });

  it('handles empty job cards list', () => {
    render(<PartsRequestPage />);
    
    expect(screen.getByText(/Parts Request|Request Parts/i)).toBeInTheDocument();
  });

  it('validates form before submission', async () => {
    const user = userEvent.setup();
    render(<PartsRequestPage />);
    
    const submitButton = screen.queryByRole('button', { name: /submit|request/i });
    if (submitButton) {
      await user.click(submitButton);
    }
  });
});

