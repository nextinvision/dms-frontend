import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';
import type { PartsIssue, PartsIssueFormData } from '@/shared/types/central-inventory.types';

export interface CentralInventoryItem {
    id: string;
    partName: string;
    partNumber: string;
    category: string;
    stockQuantity: number;
    allocated: number;
    available: number;
    unitPrice: number;
    hsnCode?: string;
    reorderPoint: number;
    reorderQuantity: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCentralInventoryDto {
    partName: string;
    partNumber: string;
    category: string;
    stockQuantity: number;
    allocated?: number;
    unitPrice: number;
    reorderPoint: number;
    reorderQuantity: number;
}

class CentralInventoryRepository extends BaseRepository<CentralInventoryItem> {
    protected endpoint = '/central-inventory';

    /**
     * Search central inventory items
     */
    async search(searchTerm: string, category?: string): Promise<CentralInventoryItem[]> {
        const params: Record<string, any> = { search: searchTerm };
        if (category) params.category = category;
        return this.getAll(params);
    }

    /**
     * Get all stock items
     */
    async getAllStock(): Promise<CentralInventoryItem[]> {
        return this.getAll();
    }

    /**
     * Create inventory part
     */
    async createPart(data: CreateCentralInventoryDto): Promise<CentralInventoryItem> {
        const response = await apiClient.post<CentralInventoryItem>(`${this.endpoint}/parts`, data);
        return response.data;
    }

    /**
     * Get all parts issues
     */
    async getAllPartsIssues(): Promise<PartsIssue[]> {
        const response = await apiClient.get<any[]>('/parts-issues');
        let data: any[] = [];

        // Handle both direct array response and paginated response
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            // @ts-ignore - Backend returns valid structure
            data = response.data.data;
        }

        return data.map(issue => this.mapBackendIssueToFrontend(issue));
    }

    /**
     * Create parts issue
     */
    async createPartsIssue(data: PartsIssueFormData, issuedBy: string): Promise<{ issue: PartsIssue }> {
        // Map frontend form data to backend DTO
        const backendData = {
            toServiceCenterId: data.serviceCenterId,
            items: data.items.map(item => ({
                centralInventoryPartId: item.fromStock,
                requestedQty: item.quantity
            }))
        };

        const response = await apiClient.post<any>('/parts-issues', backendData);
        return { issue: this.mapBackendIssueToFrontend(response.data) };
    }

    private mapBackendIssueToFrontend(backendIssue: any): PartsIssue {
        const statusMap: Record<string, any> = {
            'PENDING_APPROVAL': 'pending_admin_approval',
            'APPROVED': 'admin_approved',
            'DISPATCHED': 'issued',
            'COMPLETED': 'received',
            'REJECTED': 'admin_rejected'
        };

        return {
            ...backendIssue,
            status: statusMap[backendIssue.status] || backendIssue.status.toLowerCase(),
            // Ensure items are mapped correctly if structure differs
            // Backend items are PartsIssueItem[]
            // Frontend PartsIssue['items'] has specific fields
            items: backendIssue.items?.map((item: any) => ({
                ...item,
                partId: item.centralInventoryPartId || item.partId,
                fromStock: item.centralInventoryPartId || item.fromStock
            })) || []
        };
    }
}

export const centralInventoryRepository = new CentralInventoryRepository();
