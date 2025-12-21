import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePartsQuery,
  usePartDetails,
  useCreatePart,
  useUpdatePart,
  useDeletePart,
} from '@/features/inventory/hooks/useParts';
import { partsRepository } from '@/core/repositories/parts.repository';
import { createMockPart } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/core/repositories/parts.repository', () => ({
  partsRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getLowStock: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useParts hooks', () => {
  const mockPart = createMockPart({
    id: 'part-1',
    partName: 'Brake Pad',
    stockQuantity: 10,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePartsQuery', () => {
    it('fetches all parts with default filter', async () => {
      vi.mocked(partsRepository.getAll).mockResolvedValue([mockPart]);

      const { result } = renderHook(() => usePartsQuery('all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockPart]);
      expect(partsRepository.getAll).toHaveBeenCalled();
    });

    it('fetches low stock parts when filter is low_stock', async () => {
      vi.mocked(partsRepository.getLowStock).mockResolvedValue([mockPart]);

      const { result } = renderHook(() => usePartsQuery('low_stock'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(partsRepository.getLowStock).toHaveBeenCalled();
    });
  });

  describe('usePartDetails', () => {
    it('fetches part details by id', async () => {
      vi.mocked(partsRepository.getById).mockResolvedValue(mockPart);

      const { result } = renderHook(() => usePartDetails('part-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPart);
      expect(partsRepository.getById).toHaveBeenCalledWith('part-1');
    });

    it('does not fetch when id is empty', () => {
      const { result } = renderHook(() => usePartDetails(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(partsRepository.getById).not.toHaveBeenCalled();
    });
  });

  describe('useCreatePart', () => {
    it('creates a new part', async () => {
      const newPart = { ...mockPart, id: 'part-2' };
      vi.mocked(partsRepository.create).mockResolvedValue(newPart);

      const { result } = renderHook(() => useCreatePart(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        partName: 'New Part',
        partId: 'PART-002',
      });

      expect(partsRepository.create).toHaveBeenCalled();
    });
  });

  describe('useUpdatePart', () => {
    it('updates an existing part', async () => {
      const updatedPart = { ...mockPart, partName: 'Updated Part' };
      vi.mocked(partsRepository.update).mockResolvedValue(updatedPart);

      const { result } = renderHook(() => useUpdatePart(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'part-1',
        data: { partName: 'Updated Part' },
      });

      expect(partsRepository.update).toHaveBeenCalledWith('part-1', { partName: 'Updated Part' });
    });
  });

  describe('useDeletePart', () => {
    it('deletes a part', async () => {
      vi.mocked(partsRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePart(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('part-1');

      expect(partsRepository.delete).toHaveBeenCalledWith('part-1');
    });
  });
});

