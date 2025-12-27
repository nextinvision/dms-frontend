import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleRepository } from '@/core/repositories/vehicle.repository';
import type { Vehicle, NewVehicleForm } from '@/shared/types/vehicle.types';

export const vehicleKeys = {
    all: ['vehicles'] as const,
    lists: () => [...vehicleKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...vehicleKeys.lists(), { filters }] as const,
    details: () => [...vehicleKeys.all, 'detail'] as const,
    detail: (id: string) => [...vehicleKeys.details(), id] as const,
    byCustomer: (customerId: string) => [...vehicleKeys.all, 'customer', customerId] as const,
};

export function useVehiclesQuery(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: vehicleKeys.list(params),
        queryFn: () => vehicleRepository.getAll(params),
    });
}

export function useCustomerVehicles(customerId: string) {
    return useQuery({
        queryKey: vehicleKeys.byCustomer(customerId),
        queryFn: () => vehicleRepository.getByCustomerId(customerId),
        enabled: !!customerId,
    });
}

export function useVehicleDetails(id: string) {
    return useQuery({
        queryKey: vehicleKeys.detail(id),
        queryFn: () => vehicleRepository.getById(id),
        enabled: !!id,
    });
}

export function useCreateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: NewVehicleForm) => vehicleRepository.create(data as unknown as Partial<Vehicle>),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            if ((variables as any).customerId) {
                queryClient.invalidateQueries({ queryKey: vehicleKeys.byCustomer((variables as any).customerId) });
            }
        },
    });
}

export function useUpdateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => vehicleRepository.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(String(data.id)) });
            queryClient.invalidateQueries({ queryKey: vehicleKeys.byCustomer(String(data.customerId)) });
        },
    });
}
