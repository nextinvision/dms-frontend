import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/core/api/client';
import type { Part } from '@/shared/types/inventory.types'; // Assuming types location

interface PartsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
}

async function fetchParts(params: PartsQueryParams = {}) {
    const response = await apiClient.get<Part[]>('/inventory/parts', {
        params: params as Record<string, unknown>
    });
    return response.data;
}

export function usePartsQuery(params: PartsQueryParams = {}) {
    return useQuery({
        queryKey: ['parts', params],
        queryFn: () => fetchParts(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
