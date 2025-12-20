import { BaseRepository } from './base.repository';
import type { Invoice, ServiceCenterInvoice } from '@/shared/types/invoice.types';

class InvoiceRepository extends BaseRepository<ServiceCenterInvoice> {
    protected endpoint = '/invoices';

    async getByJobCardId(jobCardId: string): Promise<ServiceCenterInvoice[]> {
        const response = await this.getAll({ jobCardId });
        return response;
    }

    // Method to handle Central Inventory Invoices if needed, or create a separate repository
    async getCentralInvoices(params?: any): Promise<Invoice[]> {
        // This might need a different endpoint or type handling
        // For now, assuming standard pattern
        return [];
    }
}

export const invoiceRepository = new InvoiceRepository();
