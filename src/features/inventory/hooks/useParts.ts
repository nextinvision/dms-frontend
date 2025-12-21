import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partsRepository } from '@/core/repositories/parts.repository';
import type { Part, PartFormData } from '@/shared/types/inventory.types';

export const partsKeys = {
    all: ['parts'] as const,
    lists: () => [...partsKeys.all, 'list'] as const,
    list: (filters: string) => [...partsKeys.lists(), { filters }] as const,
    details: () => [...partsKeys.all, 'detail'] as const,
    detail: (id: string) => [...partsKeys.details(), id] as const,
};

export function usePartsQuery(filter: string = 'all') {
    return useQuery({
        queryKey: partsKeys.list(filter),
        queryFn: () => filter === 'low_stock' ? partsRepository.getLowStock() : partsRepository.getAll(),
    });
}

export function usePartDetails(id: string) {
    return useQuery({
        queryKey: partsKeys.detail(id),
        queryFn: () => partsRepository.getById(id),
        enabled: !!id,
    });
}

export function useCreatePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PartFormData) => partsRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: partsKeys.lists() });
        },
    });
}

export function useUpdatePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Part> }) => partsRepository.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: partsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: partsKeys.detail(data.id) });
        },
    });
}

export function useDeletePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => partsRepository.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: partsKeys.lists() });
        },
    });
}
