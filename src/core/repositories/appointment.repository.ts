import { BaseRepository } from './base.repository';
import type { AppointmentRecord, AppointmentStatus } from '@/app/(service-center)/sc/appointments/types';

class AppointmentRepository extends BaseRepository<AppointmentRecord> {
    protected endpoint = '/appointments';

    async updateStatus(id: string | number, status: AppointmentStatus): Promise<AppointmentRecord> {
        const response = await this.update(id.toString(), { status });
        return response;
    }
}

export const appointmentRepository = new AppointmentRepository();
