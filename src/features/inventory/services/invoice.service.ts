/**
 * Invoice Service - Simplified version using backend API
 * Migrated from mock repository
 */

import { apiClient } from '@/core/api/client';
import type { Invoice, InvoiceFormData } from '@/shared/types/invoice.types';

class InvoiceService {
  /**
   * Get all invoices
   * @param invoiceType - Optional filter by invoice type ('OTC_ORDER' | 'JOB_CARD')
   */
  async getAllInvoices(invoiceType?: 'OTC_ORDER' | 'JOB_CARD'): Promise<Invoice[]> {
    const params = invoiceType ? { invoiceType } : {};
    const response = await apiClient.get<Invoice[]>('/invoices', { params });
    return response.data;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  }

  /**
   * Create invoice from parts issue
   */
  async createInvoice(data: InvoiceFormData): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  }
}

export const invoiceService = new InvoiceService();
