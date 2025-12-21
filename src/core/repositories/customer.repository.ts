import { BaseRepository } from './base.repository';
import type { CustomerWithVehicles } from '@/shared/types/vehicle.types';

class CustomerRepository extends BaseRepository<CustomerWithVehicles> {
    protected endpoint = '/customers';

    async search(query: string, type: string): Promise<CustomerWithVehicles[]> {
        const response = await this.getAll({ search: query, type });
        return response;
    }
}

export const customerRepository = new CustomerRepository();
