import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useJobCardCreation } from "@/features/job-cards/hooks/useJobCardCreation";
import { jobCardService } from '@/features/job-cards/services/jobCard.service';
import { createMockJobCard } from '@/test/utils/mocks';

// Mock service
vi.mock('@/features/job-cards/services/jobCard.service', () => ({
  jobCardService: {
    createFromQuotation: vi.fn(),
    assignEngineer: vi.fn(),
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

describe('useJobCardCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFromQuotation', () => {
    it('creates job card from quotation', async () => {
      const mockJobCard = createMockJobCard({ id: '1' });
      vi.mocked(jobCardService.createFromQuotation).mockResolvedValue(mockJobCard);

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      const jobCard = await result.current.createFromQuotation('quotation-1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobCard).toEqual(mockJobCard);
      expect(jobCardService.createFromQuotation).toHaveBeenCalledWith('quotation-1', undefined);
    });

    it('creates job card with engineer', async () => {
      const mockJobCard = createMockJobCard({ id: '1' });
      vi.mocked(jobCardService.createFromQuotation).mockResolvedValue(mockJobCard);

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      await result.current.createFromQuotation('quotation-1', 'engineer-1');

      expect(jobCardService.createFromQuotation).toHaveBeenCalledWith('quotation-1', 'engineer-1');
    });

    it('handles errors', async () => {
      vi.mocked(jobCardService.createFromQuotation).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      const jobCard = await result.current.createFromQuotation('quotation-1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed');
      });

      expect(jobCard).toBeNull();
    });

    it('sets loading state during creation', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      vi.mocked(jobCardService.createFromQuotation).mockReturnValue(promise as any);

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      const creationPromise = result.current.createFromQuotation('quotation-1');

      // Check loading state immediately (before promise resolves)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!(createMockJobCard());
      await creationPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('assignEngineer', () => {
    it('assigns engineer to job card', async () => {
      const mockJobCard = createMockJobCard({ id: '1', assignedEngineer: 'Engineer Name' });
      vi.mocked(jobCardService.assignEngineer).mockResolvedValue(mockJobCard);

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      const jobCard = await result.current.assignEngineer('job-1', 'engineer-1', 'Engineer Name');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobCard).toEqual(mockJobCard);
      expect(jobCardService.assignEngineer).toHaveBeenCalledWith('job-1', 'engineer-1', 'Engineer Name');
    });

    it('handles errors', async () => {
      vi.mocked(jobCardService.assignEngineer).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      const jobCard = await result.current.assignEngineer('job-1', 'engineer-1', 'Engineer Name');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed');
      });

      expect(jobCard).toBeNull();
    });

    it('sets loading state during assignment', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      vi.mocked(jobCardService.assignEngineer).mockReturnValue(promise as any);

      const { result } = renderHook(() => useJobCardCreation(), {
        wrapper: createWrapper(),
      });

      const assignmentPromise = result.current.assignEngineer('job-1', 'engineer-1', 'Engineer Name');

      // Check loading state immediately (before promise resolves)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!(createMockJobCard());
      await assignmentPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

