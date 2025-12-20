import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useInvoicesQuery,
  useInvoiceDetails,
  useJobCardInvoices,
  useCreateInvoice,
  useUpdateInvoice,
} from '@/features/invoices/hooks/useInvoices';
import { invoiceRepository } from '@/core/repositories/invoice.repository';
import { createMockInvoice } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/core/repositories/invoice.repository', () => ({
  invoiceRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByJobCardId: vi.fn(),
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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useInvoices hooks', () => {
  const mockInvoice = createMockInvoice({
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    customerName: 'John Doe',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useInvoicesQuery', () => {
    it('fetches invoices with default params', async () => {
      vi.mocked(invoiceRepository.getAll).mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoicesQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockInvoice]);
      expect(invoiceRepository.getAll).toHaveBeenCalledWith({});
    });

    it('fetches invoices with filters', async () => {
      vi.mocked(invoiceRepository.getAll).mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoicesQuery({ status: 'paid' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invoiceRepository.getAll).toHaveBeenCalledWith({ status: 'paid' });
    });
  });

  describe('useInvoiceDetails', () => {
    it('fetches invoice details by id', async () => {
      vi.mocked(invoiceRepository.getById).mockResolvedValue(mockInvoice);

      const { result } = renderHook(() => useInvoiceDetails('inv-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInvoice);
      expect(invoiceRepository.getById).toHaveBeenCalledWith('inv-1');
    });

    it('does not fetch when id is empty', () => {
      const { result } = renderHook(() => useInvoiceDetails(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(invoiceRepository.getById).not.toHaveBeenCalled();
    });
  });

  describe('useJobCardInvoices', () => {
    it('fetches invoices by job card id', async () => {
      vi.mocked(invoiceRepository.getByJobCardId).mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useJobCardInvoices('jc-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockInvoice]);
      expect(invoiceRepository.getByJobCardId).toHaveBeenCalledWith('jc-1');
    });

    it('does not fetch when jobCardId is empty', () => {
      const { result } = renderHook(() => useJobCardInvoices(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(invoiceRepository.getByJobCardId).not.toHaveBeenCalled();
    });
  });

  describe('useCreateInvoice', () => {
    it('creates a new invoice', async () => {
      const newInvoice = { ...mockInvoice, id: 'inv-2' };
      vi.mocked(invoiceRepository.create).mockResolvedValue(newInvoice);

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        customerName: 'Jane Doe',
        amount: '2000',
      });

      expect(invoiceRepository.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateInvoice', () => {
    it('updates an existing invoice', async () => {
      const updatedInvoice = { ...mockInvoice, status: 'paid' };
      vi.mocked(invoiceRepository.update).mockResolvedValue(updatedInvoice);

      const { result } = renderHook(() => useUpdateInvoice(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'inv-1',
        data: { status: 'paid' },
      });

      expect(invoiceRepository.update).toHaveBeenCalledWith('inv-1', { status: 'paid' });
    });
  });
});

