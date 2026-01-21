import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobCardRepository } from '@/core/repositories/job-card.repository';
import { jobCardService } from '@/features/job-cards/services/jobCard.service';
import type { JobCard, PartsRequest, PartsRequestStatus } from '@/shared/types/job-card.types';

export const jobCardKeys = {
    all: ['job-cards'] as const,
    lists: () => [...jobCardKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...jobCardKeys.lists(), { filters }] as const,
    details: () => [...jobCardKeys.all, 'detail'] as const,
    detail: (id: string) => [...jobCardKeys.details(), id] as const,
    byVehicle: (vehicleId: string) => [...jobCardKeys.all, 'vehicle', vehicleId] as const,
    partsRequests: () => [...jobCardKeys.all, 'parts-requests'] as const,
    pendingPartsRequests: (serviceCenterId?: string) => [...jobCardKeys.partsRequests(), 'pending', serviceCenterId] as const,
};

/**
 * Root-level cache invalidation utility
 * Invalidates all job card related queries to ensure UI reflects latest data
 */
function invalidateAllJobCardQueries(queryClient: ReturnType<typeof useQueryClient>) {
    // Invalidate all list queries (with any filters)
    queryClient.invalidateQueries({ queryKey: jobCardKeys.lists() });
    // Invalidate all detail queries
    queryClient.invalidateQueries({ queryKey: jobCardKeys.details() });
    // Invalidate vehicle-specific queries
    queryClient.invalidateQueries({ queryKey: [...jobCardKeys.all, 'vehicle'] });
    // Invalidate parts requests
    queryClient.invalidateQueries({ queryKey: jobCardKeys.partsRequests() });
}

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

/**
 * Hook for fetching pending parts requests
 */
export function usePendingPartsRequests(serviceCenterId?: string) {
    return useQuery({
        queryKey: jobCardKeys.pendingPartsRequests(serviceCenterId),
        queryFn: () => jobCardService.getPendingPartsRequests(serviceCenterId),
    });
}

/**
 * Create job card mutation with comprehensive cache invalidation
 */
export function useCreateJobCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, userId }: { data: Partial<JobCard>; userId?: string }) => 
            jobCardService.create(data, userId),
        onSuccess: (data) => {
            // Invalidate all job card queries to reflect new job card
            invalidateAllJobCardQueries(queryClient);
            // Also invalidate vehicle-specific queries since job card is associated with vehicle
            if (data.vehicleId) {
                queryClient.invalidateQueries({ queryKey: jobCardKeys.byVehicle(data.vehicleId) });
            }
        },
    });
}

/**
 * Update job card mutation with comprehensive cache invalidation
 */
export function useUpdateJobCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data, userId }: { id: string; data: Partial<JobCard>; userId?: string }) => 
            jobCardService.update(id, data, userId),
        onSuccess: (data) => {
            // Invalidate all related queries
            invalidateAllJobCardQueries(queryClient);
            // Specifically invalidate this job card's detail
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
            // Invalidate vehicle queries if vehicle changed
            if (data.vehicleId) {
                queryClient.invalidateQueries({ queryKey: jobCardKeys.byVehicle(data.vehicleId) });
            }
        },
    });
}

/**
 * Update job card status mutation
 */
export function useUpdateJobCardStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => 
            jobCardService.updateStatus(id, status),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}

/**
 * Assign engineer to job card mutation
 */
export function useAssignEngineer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, engineerId, engineerName }: { id: string; engineerId: string; engineerName: string }) => 
            jobCardService.assignEngineer(id, engineerId, engineerName),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}

/**
 * Pass job card to manager mutation
 */
export function usePassToManager() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, managerId }: { id: string; managerId: string }) => 
            jobCardService.passToManager(id, managerId),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}

/**
 * Manager review mutation (approve/reject)
 */
export function useManagerReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes?: string }) => 
            jobCardService.managerReview(id, { status, notes }),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}

/**
 * Convert temporary job card to actual mutation
 */
export function useConvertToActual() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => jobCardService.convertToActual(id),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(data.id) });
        },
    });
}

/**
 * Create job card from quotation mutation
 */
export function useCreateFromQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quotationId, engineerId }: { quotationId: string; engineerId?: string }) => 
            jobCardService.createFromQuotation(quotationId, engineerId),
        onSuccess: (data) => {
            invalidateAllJobCardQueries(queryClient);
            if (data.vehicleId) {
                queryClient.invalidateQueries({ queryKey: jobCardKeys.byVehicle(data.vehicleId) });
            }
        },
    });
}

/**
 * Create parts request mutation
 */
export function useCreatePartsRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ jobCardId, items }: { jobCardId: string; items: any[] }) => 
            jobCardService.createPartsRequest(jobCardId, items),
        onSuccess: (_, variables) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(variables.jobCardId) });
            queryClient.invalidateQueries({ queryKey: jobCardKeys.partsRequests() });
        },
    });
}

/**
 * Update parts request status mutation
 */
export function useUpdatePartsRequestStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, notes, jobCardId }: { id: string; status: PartsRequestStatus; notes?: string; jobCardId?: string }) => 
            jobCardService.updatePartsRequestStatus(id, status, notes),
        onSuccess: (_, variables) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.partsRequests() });
            // If jobCardId is provided, invalidate that job card's detail
            if (variables.jobCardId) {
                queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(variables.jobCardId) });
            }
        },
    });
}

/**
 * Delete parts request mutation
 */
export function useDeletePartsRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, jobCardId }: { id: string; jobCardId?: string }) => 
            jobCardService.deletePartsRequest(id),
        onSuccess: (_, variables) => {
            invalidateAllJobCardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: jobCardKeys.partsRequests() });
            if (variables.jobCardId) {
                queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(variables.jobCardId) });
            }
        },
    });
}

// Alias for backward compatibility
export const useJobCards = useJobCardsQuery;
