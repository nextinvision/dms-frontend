import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPartsRequestFromJobCard } from "@/shared/utils/jobCardPartsRequest.util";
import { createMockJobCard } from '@/test/utils/mocks';
import { jobCardPartsRequestService } from '@/features/inventory/services/jobCardPartsRequest.service';
import { partsMasterService } from '@/features/inventory/services/partsMaster.service';

// Mock services
vi.mock('@/features/inventory/services/jobCardPartsRequest.service', () => ({
  jobCardPartsRequestService: {
    createRequestFromJobCard: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/partsMaster.service', () => ({
  partsMasterService: {
    getAll: vi.fn(),
  },
}));

describe('createPartsRequestFromJobCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when no parts are selected', async () => {
    const jobCard = createMockJobCard({ parts: [] });
    const requestedBy = 'Test User';

    await createPartsRequestFromJobCard(jobCard, requestedBy);

    expect(jobCardPartsRequestService.createRequestFromJobCard).not.toHaveBeenCalled();
  });

  it('creates parts request when parts are selected', async () => {
    const mockParts = [
      { id: '1', partName: 'Brake Pad', partNumber: 'BP-001' },
      { id: '2', partName: 'Oil Filter', partNumber: 'OF-001' },
    ];

    vi.mocked(partsMasterService.getAll).mockResolvedValue(mockParts as any);

    const jobCard = createMockJobCard({
      parts: ['Brake Pad', 'Oil Filter'],
    });
    const requestedBy = 'Test User';

    await createPartsRequestFromJobCard(jobCard, requestedBy);

    expect(partsMasterService.getAll).toHaveBeenCalled();
    expect(jobCardPartsRequestService.createRequestFromJobCard).toHaveBeenCalledWith(
      jobCard,
      expect.arrayContaining([
        expect.objectContaining({ partName: 'Brake Pad' }),
        expect.objectContaining({ partName: 'Oil Filter' }),
      ]),
      requestedBy
    );
  });

  it('handles parts not found in master', async () => {
    vi.mocked(partsMasterService.getAll).mockResolvedValue([]);

    const jobCard = createMockJobCard({
      parts: ['Unknown Part'],
    });
    const requestedBy = 'Test User';

    await createPartsRequestFromJobCard(jobCard, requestedBy);

    expect(jobCardPartsRequestService.createRequestFromJobCard).toHaveBeenCalledWith(
      jobCard,
      expect.arrayContaining([
        expect.objectContaining({
          partId: expect.stringContaining('unknown'),
          partName: 'Unknown Part',
        }),
      ]),
      requestedBy
    );
  });

  it('handles case-insensitive part name matching', async () => {
    const mockParts = [
      { id: '1', partName: 'Brake Pad', partNumber: 'BP-001' },
    ];

    vi.mocked(partsMasterService.getAll).mockResolvedValue(mockParts as any);

    const jobCard = createMockJobCard({
      parts: ['brake pad'], // lowercase
    });
    const requestedBy = 'Test User';

    await createPartsRequestFromJobCard(jobCard, requestedBy);

    expect(jobCardPartsRequestService.createRequestFromJobCard).toHaveBeenCalledWith(
      jobCard,
      expect.arrayContaining([
        expect.objectContaining({ partName: 'Brake Pad' }),
      ]),
      requestedBy
    );
  });

  it('does not throw error on service failure', async () => {
    vi.mocked(partsMasterService.getAll).mockRejectedValue(new Error('Service error'));

    const jobCard = createMockJobCard({
      parts: ['Brake Pad'],
    });
    const requestedBy = 'Test User';

    await expect(createPartsRequestFromJobCard(jobCard, requestedBy)).resolves.not.toThrow();
  });
});

