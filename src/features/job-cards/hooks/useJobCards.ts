import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobCardRepository } from '@/core/repositories/job-card.repository';
import type { JobCard } from '@/shared/types/job-card.types';

export const jobCardKeys = {
    all: ['job-cards'] as const,
    lists: () => [...jobCardKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...jobCardKeys.lists(), { filters }] as const,
    details: () => [...jobCardKeys.all, 'detail'] as const,
    detail: (id: string) => [...jobCardKeys.details(), id] as const,
    byVehicle: (vehicleId: string) => [...jobCardKeys.all, 'vehicle', vehicleId] as const,
};

export function useJobCardsQuery(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: jobCardKeys.list(params),
        queryFn: () => jobCardRepository.getAll(params),
    });
}

export function useJobCardDetails(id: string) {
    return useQuery({
        queryKey: jobCardKeys.detail(id),
        queryFn: () => jobCardRepository.getById(id),
        enabled: !!id,
    });
}

export function useVehicleJobCards(vehicleId: string) {
    return useQuery({
        queryKey: jobCardKeys.byVehicle(vehicleId),
        queryFn: () => jobCardRepository.getByVehicleId(vehicleId),
        enabled: !!vehicleId,
    });
}

export function useCreateJobCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<JobCard>) => jobCardRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobCardKeys.lists() });
        },
    });
}

export function useUpdateJobCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<JobCard> }) => jobCardRepository.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: jobCardKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}
// Alias for backward compatibility
export const useJobCards = useJobCardsQuery;
