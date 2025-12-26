import { BaseRepository } from './base.repository';
import type { Quotation } from '@/shared/types';

class QuotationRepository extends BaseRepository<Quotation> {
    protected endpoint = '/quotations';

    async getByJobCardId(jobCardId: string): Promise<Quotation[]> {
        const response = await this.getAll({ jobCardId });
        return response;
    }

    async getByCustomerId(customerId: string): Promise<Quotation[]> {
        const response = await this.getAll({ customerId });
        return response;
    }
}

export const quotationRepository = new QuotationRepository();
