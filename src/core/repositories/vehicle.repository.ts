import { BaseRepository } from './base.repository';
import type { Vehicle } from '@/shared/types/vehicle.types';

class VehicleRepository extends BaseRepository<Vehicle> {
    protected endpoint = '/vehicles';

    async getByCustomerId(customerId: string): Promise<Vehicle[]> {
        const response = await this.getAll({ customerId });
        return response;
    }
}

export const vehicleRepository = new VehicleRepository();
