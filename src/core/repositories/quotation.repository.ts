import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';
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

    async sendToCustomer(id: string): Promise<{ pdfUrl: string; whatsappNumber: string; fileId: string }> {
        const response = await apiClient.post<{ pdfUrl: string; whatsappNumber: string; fileId: string }>(
            `${this.endpoint}/${id}/send-to-customer`
        );
        return response.data;
    }
}

export const quotationRepository = new QuotationRepository();
