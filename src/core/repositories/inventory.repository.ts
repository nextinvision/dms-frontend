import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';

export interface InventoryPart {
    id: string;
    partId?: string;
    serviceCenterId: string;
    
    // Basic Part Information
    oemPartNumber?: string;
    partName: string;
    partNumber: string;
    originType?: string;
    category: string;
    description?: string;
    
    // Stock Information
    stockQuantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    unit?: string;
    location?: string;
    
    // Part Details
    brandName?: string;
    variant?: string;
    partType?: string;
    color?: string;
    
    // Pricing - Purchase
    costPrice: number | string;
    pricePreGst?: number | string;
    gstRateInput?: number | string;
    gstInput?: number | string;
    
    // Pricing - Sale
    unitPrice: number | string;
    gstRate: number;
    gstRateOutput?: number | string;
    totalPrice?: number | string;
    totalGst?: number | string;
    
    // Labour Information
    labourName?: string;
    labourCode?: string;
    labourWorkTime?: string;
    labourRate?: number | string;
    labourGstRate?: number | string;
    labourPrice?: number | string;
    
    // Flags
    highValuePart?: boolean;
    
    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    
    // Legacy fields for compatibility
    quantity?: number;
    minLevel?: number;
    maxLevel?: number;
}

export interface StockAdjustment {
    adjustmentType: 'ADD' | 'SUBTRACT' | 'SET';
    quantity: number;
    reason: string;
    notes?: string;
    referenceNumber?: string;
}

class InventoryRepository extends BaseRepository<InventoryPart> {
    protected endpoint = '/inventory';

    async getLowStock(serviceCenterId?: string): Promise<InventoryPart[]> {
        const params = serviceCenterId ? { serviceCenterId } : {};
        const response = await apiClient.get<InventoryPart[]>(`${this.endpoint}/low-stock`, { params });
        return response.data;
    }

    async adjustStock(partId: string, adjustmentData: StockAdjustment): Promise<InventoryPart> {
        const response = await apiClient.patch<InventoryPart>(
            `${this.endpoint}/parts/${partId}/adjust-stock`,
            adjustmentData
        );
        return response.data;
    }

    async createPart(data: Partial<InventoryPart>): Promise<InventoryPart> {
        const response = await apiClient.post<InventoryPart>(`${this.endpoint}/parts`, data);
        return response.data;
    }
}

export const inventoryRepository = new InventoryRepository();
