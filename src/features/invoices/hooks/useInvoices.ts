import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceRepository } from '@/core/repositories/invoice.repository';
import type { ServiceCenterInvoice } from '@/shared/types/invoice.types';

export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...invoiceKeys.lists(), { filters }] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: string) => [...invoiceKeys.details(), id] as const,
    byJobCard: (jobCardId: string) => [...invoiceKeys.all, 'job-card', jobCardId] as const,
};

export function useInvoicesQuery(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => invoiceRepository.getAll(params),
    });
}

export function useInvoiceDetails(id: string) {
    return useQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: () => invoiceRepository.getById(id),
        enabled: !!id,
    });
}

export function useJobCardInvoices(jobCardId: string) {
    return useQuery({
        queryKey: invoiceKeys.byJobCard(jobCardId),
        queryFn: () => invoiceRepository.getByJobCardId(jobCardId),
        enabled: !!jobCardId,
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<ServiceCenterInvoice>) => invoiceRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
}

export function useUpdateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ServiceCenterInvoice> }) => invoiceRepository.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
        },
    });
}
