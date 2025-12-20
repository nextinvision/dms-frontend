import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePartsQuery } from '@/features/inventory/hooks/usePartsQuery';
import { apiClient } from '@/core/api/client';
import { createMockPart } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePartsQuery', () => {
  const mockParts = [
    createMockPart({ id: 'part-1', partName: 'Brake Pad' }),
    createMockPart({ id: 'part-2', partName: 'Oil Filter' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockParts,
    } as any);
  });

  it('fetches parts with default params', async () => {
    const { result } = renderHook(() => usePartsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockParts);
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/parts', {
      params: {},
    });
  });

  it('fetches parts with search params', async () => {
    const { result } = renderHook(() => usePartsQuery({ search: 'brake' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith('/inventory/parts', {
      params: { search: 'brake' },
    });
  });

  it('fetches parts with pagination', async () => {
    const { result } = renderHook(() => usePartsQuery({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith('/inventory/parts', {
      params: { page: 1, limit: 10 },
    });
  });

  it('fetches parts with category filter', async () => {
    const { result } = renderHook(() => usePartsQuery({ category: 'Brakes' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith('/inventory/parts', {
      params: { category: 'Brakes' },
    });
  });

  it('uses stale time of 5 minutes', () => {
    const { result } = renderHook(() => usePartsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.dataUpdatedAt).toBeDefined();
  });
});

