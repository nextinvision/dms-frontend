import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useJobCardsQuery,
  useJobCardDetails,
  useVehicleJobCards,
  useCreateJobCard,
  useUpdateJobCard,
} from "@/features/job-cards/hooks/useJobCards";
import { jobCardRepository } from '@/core/repositories/job-card.repository';
import { createMockJobCard } from '@/test/utils/mocks';

// Mock repository
vi.mock('@/core/repositories/job-card.repository', () => ({
  jobCardRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByVehicleId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useJobCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useJobCardsQuery', () => {
    it('fetches all job cards', async () => {
      const mockJobCards = [createMockJobCard({ id: '1' })];
      vi.mocked(jobCardRepository.getAll).mockResolvedValue(mockJobCards);

      const { result } = renderHook(() => useJobCardsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJobCards);
      expect(jobCardRepository.getAll).toHaveBeenCalled();
    });

    it('handles loading state', () => {
      vi.mocked(jobCardRepository.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useJobCardsQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('handles error state', async () => {
      vi.mocked(jobCardRepository.getAll).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useJobCardsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('passes params to repository', async () => {
      const params = { status: 'Created' };
      vi.mocked(jobCardRepository.getAll).mockResolvedValue([]);

      renderHook(() => useJobCardsQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(jobCardRepository.getAll).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('useJobCardDetails', () => {
    it('fetches job card details', async () => {
      const mockJobCard = createMockJobCard({ id: '1' });
      vi.mocked(jobCardRepository.getById).mockResolvedValue(mockJobCard);

      const { result } = renderHook(() => useJobCardDetails('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJobCard);
      expect(jobCardRepository.getById).toHaveBeenCalledWith('1');
    });

    it('does not fetch when id is empty', () => {
      const { result } = renderHook(() => useJobCardDetails(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(jobCardRepository.getById).not.toHaveBeenCalled();
    });
  });

  describe('useVehicleJobCards', () => {
    it('fetches job cards for vehicle', async () => {
      const mockJobCards = [createMockJobCard({ id: '1', vehicleId: '1' })];
      vi.mocked(jobCardRepository.getByVehicleId).mockResolvedValue(mockJobCards);

      const { result } = renderHook(() => useVehicleJobCards('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJobCards);
      expect(jobCardRepository.getByVehicleId).toHaveBeenCalledWith('1');
    });

    it('does not fetch when vehicleId is empty', () => {
      const { result } = renderHook(() => useVehicleJobCards(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(jobCardRepository.getByVehicleId).not.toHaveBeenCalled();
    });
  });

  describe('useCreateJobCard', () => {
    it('creates job card', async () => {
      const newJobCardData = { customerId: '1', vehicleId: '1' };
      const createdJobCard = createMockJobCard({ ...newJobCardData, id: '1' });
      vi.mocked(jobCardRepository.create).mockResolvedValue(createdJobCard);

      const { result } = renderHook(() => useCreateJobCard(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(newJobCardData);

      expect(jobCardRepository.create).toHaveBeenCalledWith(newJobCardData);
    });
  });

  describe('useUpdateJobCard', () => {
    it('updates job card', async () => {
      const updateData = { status: 'In Progress' as const };
      const updatedJobCard = createMockJobCard({ id: '1', status: 'In Progress' });
      vi.mocked(jobCardRepository.update).mockResolvedValue(updatedJobCard);

      const { result } = renderHook(() => useUpdateJobCard(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: '1', data: updateData });

      expect(jobCardRepository.update).toHaveBeenCalledWith('1', updateData);
    });
  });
});

