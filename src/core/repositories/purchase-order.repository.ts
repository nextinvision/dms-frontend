import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    fromServiceCenterId: string;
    fromServiceCenter?: {
        id: string;
        name: string;
        code: string;
    };
    requestedById: string;
    requestedBy?: {
        id: string;
        name: string;
        email: string;
    };
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'COMPLETED' | 'CANCELLED';
    orderDate: string;
    expectedDeliveryDate?: string;
    approvedById?: string;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    partsIssueId?: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    totalAmount: number;
    paymentTerms?: string;
    items: PurchaseOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    centralInventoryPartId: string;
    quantity: number;
    receivedQty: number;
    unitPrice: number;
    gstRate: number;
}

export interface CreatePurchaseOrderDto {
    fromServiceCenterId?: string;
    requestedById?: string;
    supplierId?: string;
    orderDate: string;
    expectedDeliveryDate?: string;
    items: {
        centralInventoryPartId?: string;
        inventoryPartId?: string;
        partName?: string;
        quantity: number;
        unitPrice: number;
        gstRate: number;
        urgency?: string;
        notes?: string;
    }[];
    paymentTerms?: string;
    orderNotes?: string;
}

class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
    protected endpoint = '/purchase-orders';

    /**
     * Submit purchase order for approval
     */
    async submit(id: string): Promise<PurchaseOrder> {
        const response = await apiClient.patch<PurchaseOrder>(`${this.endpoint}/${id}/submit`);
        return response.data;
    }

    /**
     * Approve purchase order (Admin only)
     */
    async approve(id: string): Promise<PurchaseOrder> {
        const response = await apiClient.patch<PurchaseOrder>(`${this.endpoint}/${id}/approve`);
        return response.data;
    }

    /**
     * Issue parts from approved purchase order (CIM)
     */
    async issue(id: string, approvedItems: Array<{ itemId: string; approvedQty: number }>): Promise<any> {
        const response = await apiClient.patch<any>(`${this.endpoint}/${id}/issue`, { approvedItems });
        return response.data;
    }

    /**
     * Get purchase orders by status
     */
    async getByStatus(status: string): Promise<PurchaseOrder[]> {
        return this.getAll({ status });
    }

    /**
     * Get purchase orders by service center
     */
    async getByServiceCenter(serviceCenterId: string): Promise<PurchaseOrder[]> {
        return this.getAll({ fromServiceCenterId: serviceCenterId });
    }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
