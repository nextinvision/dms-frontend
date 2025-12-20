import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useCustomersQuery,
  useCustomerSearch,
  useCustomerDetails,
  useCreateCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks/useCustomers";
import { customerRepository } from '@/core/repositories/customer.repository';
import { createMockCustomer } from '@/test/utils/mocks';

// Mock repository
vi.mock('@/core/repositories/customer.repository', () => ({
  customerRepository: {
    getAll: vi.fn(),
    search: vi.fn(),
    getById: vi.fn(),
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

describe('useCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCustomersQuery', () => {
    it('fetches all customers', async () => {
      const mockCustomers = [createMockCustomer({ id: '1' })];
      vi.mocked(customerRepository.getAll).mockResolvedValue(mockCustomers);

      const { result } = renderHook(() => useCustomersQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomers);
      expect(customerRepository.getAll).toHaveBeenCalled();
    });

    it('passes params to repository', async () => {
      const params = { customerType: 'B2C' };
      vi.mocked(customerRepository.getAll).mockResolvedValue([]);

      renderHook(() => useCustomersQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(customerRepository.getAll).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('useCustomerSearch', () => {
    it('searches customers', async () => {
      const mockCustomers = [createMockCustomer({ id: '1', name: 'John Doe' })];
      vi.mocked(customerRepository.search).mockResolvedValue(mockCustomers);

      const { result } = renderHook(() => useCustomerSearch('John'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomers);
      expect(customerRepository.search).toHaveBeenCalledWith('John', 'name');
    });

    it('does not search when query is empty', () => {
      const { result } = renderHook(() => useCustomerSearch(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(customerRepository.search).not.toHaveBeenCalled();
    });

    it('uses custom search type', async () => {
      vi.mocked(customerRepository.search).mockResolvedValue([]);

      renderHook(() => useCustomerSearch('test', 'phone'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(customerRepository.search).toHaveBeenCalledWith('test', 'phone');
      });
    });
  });

  describe('useCustomerDetails', () => {
    it('fetches customer details', async () => {
      const mockCustomer = createMockCustomer({ id: '1' });
      vi.mocked(customerRepository.getById).mockResolvedValue(mockCustomer);

      const { result } = renderHook(() => useCustomerDetails('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomer);
      expect(customerRepository.getById).toHaveBeenCalledWith('1');
    });

    it('does not fetch when id is empty', () => {
      const { result } = renderHook(() => useCustomerDetails(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(customerRepository.getById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateCustomer', () => {
    it('creates customer', async () => {
      const newCustomer = { name: 'John Doe', phone: '+1234567890' };
      const createdCustomer = createMockCustomer({ ...newCustomer, id: '1' });
      vi.mocked(customerRepository.create).mockResolvedValue(createdCustomer);

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(newCustomer);

      expect(customerRepository.create).toHaveBeenCalledWith(newCustomer);
    });
  });

  describe('useUpdateCustomer', () => {
    it('updates customer', async () => {
      const updateData = { name: 'Jane Doe' };
      const updatedCustomer = createMockCustomer({ id: '1', ...updateData });
      vi.mocked(customerRepository.update).mockResolvedValue(updatedCustomer);

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: '1', data: updateData });

      expect(customerRepository.update).toHaveBeenCalledWith('1', updateData);
    });
  });
});
