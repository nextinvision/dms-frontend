import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';
import type { CustomerWithVehicles } from '@/shared/types/vehicle.types';
import type { ApiResponse } from '@/core/api/types';

class CustomerRepository extends BaseRepository<CustomerWithVehicles> {
    protected endpoint = '/customers';

    async search(query: string, type: string): Promise<CustomerWithVehicles[]> {
        // Use the dedicated search endpoint instead of getAll with params
        const response = await apiClient.get<CustomerWithVehicles[] | { data: CustomerWithVehicles[] }>(
            `${this.endpoint}/search`,
            {
                params: { query, type }
            }
        );
        
        // Handle response structure - backend TransformInterceptor wraps responses
        // Response format: { data: T, success: true, meta: {...} }
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && typeof response.data === 'object') {
            // Check if it's a nested data structure
            if ('data' in response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
        }
        // Return empty array if no valid data found
        return [];
    }
}

export const customerRepository = new CustomerRepository();
