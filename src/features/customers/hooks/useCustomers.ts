import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerRepository } from '@/core/repositories/customer.repository';
import type { NewCustomerForm, CustomerWithVehicles } from '@/shared/types';

export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...customerKeys.lists(), { filters }] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: string) => [...customerKeys.details(), id] as const,
    search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

export function useCustomersQuery(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: customerKeys.list(params),
        queryFn: () => customerRepository.getAll(params),
    });
}

export function useCustomerSearch(query: string, type: string = 'name') {
    return useQuery({
        queryKey: customerKeys.search(query),
        queryFn: () => customerRepository.search(query, type),
        enabled: !!query,
    });
}

export function useCustomerDetails(id: string) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => customerRepository.getById(id),
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: NewCustomerForm) => customerRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CustomerWithVehicles> }) =>
            customerRepository.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.detail(String(data.id)) });
        },
    });
}
