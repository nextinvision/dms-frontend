import { BaseRepository } from './base.repository';
import type { JobCard } from '@/shared/types/job-card.types';

class JobCardRepository extends BaseRepository<JobCard> {
    protected endpoint = '/job-cards';

    async getByStatus(status: string): Promise<JobCard[]> {
        const response = await this.getAll({ status });
        return response;
    }

    async getByVehicleId(vehicleId: string): Promise<JobCard[]> {
        const response = await this.getAll({ vehicleId });
        return response;
    }
}

export const jobCardRepository = new JobCardRepository();
