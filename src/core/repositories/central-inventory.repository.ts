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

    /**
     * Get all purchase orders (for Central Inventory Manager)
     * Only fetches purchase orders from service center inventory managers
     */
    async getAllPurchaseOrders(): Promise<any[]> {
        // Fetch only purchase orders from service centers (not supplier orders)
        const response = await apiClient.get<any>('/purchase-orders', {
            params: {
                onlyServiceCenterOrders: true, // Filter to only show SC orders
            }
        });
        let data: any[] = [];

        // Handle both direct array response and paginated response
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            data = response.data.data;
        }

        // Fetch central inventory parts to populate part names (for central inventory parts)
        const centralParts = await this.getAllStock();
        
        // Map and filter out null values (orders without service center)
        const mappedOrders = data
            .map(po => this.mapBackendPOToFrontend(po, centralParts))
            .filter(po => po !== null); // Remove orders without service center
        
        return mappedOrders;
    }

    /**
     * Get purchase order by ID
     */
    async getPurchaseOrderById(id: string): Promise<any> {
        const response = await apiClient.get<any>(`/purchase-orders/${id}`);
        // Fetch central inventory parts to populate part names
        const centralParts = await this.getAllStock();
        return this.mapBackendPOToFrontend(response.data, centralParts);
    }

    /**
     * Approve purchase order (Admin only)
     */
    async approvePurchaseOrder(id: string, approvedBy: string): Promise<any> {
        const response = await apiClient.patch<any>(`/purchase-orders/${id}/approve`);
        return this.mapBackendPOToFrontend(response.data);
    }

    /**
     * Issue parts from approved purchase order (CIM)
     */
    async issuePurchaseOrder(id: string, approvedItems: Array<{ itemId: string; approvedQty: number }>): Promise<any> {
        const response = await apiClient.patch<any>(`/purchase-orders/${id}/issue`, { approvedItems });
        return response.data; // Returns PartsIssue
    }

    /**
     * Map backend PurchaseOrder to frontend format
     * Returns null if purchase order doesn't have a service center (supplier orders)
     */
    private mapBackendPOToFrontend(backendPO: any, centralParts: CentralInventoryItem[] = []): any | null {
        const statusMap: Record<string, any> = {
            'DRAFT': 'pending',
            'PENDING_APPROVAL': 'pending',
            'APPROVED': 'approved',
            'ISSUED': 'fulfilled',
            'COMPLETED': 'fulfilled',
            'CANCELLED': 'rejected'
        };

        // Create a map of central inventory parts by ID
        const partsMap = new Map(centralParts.map(p => [p.id, p]));

        const serviceCenter = backendPO.fromServiceCenter;
        
        // Skip purchase orders without service center (supplier orders)
        if (!serviceCenter || !backendPO.fromServiceCenterId) {
            return null; // Will be filtered out
        }
        
        return {
            ...backendPO,
            id: backendPO.id,
            poNumber: backendPO.poNumber,
            status: statusMap[backendPO.status] || backendPO.status.toLowerCase(),
            serviceCenterId: backendPO.fromServiceCenterId,
            serviceCenterName: serviceCenter.name || 'Unknown Service Center',
            serviceCenterCode: serviceCenter.code || '',
            serviceCenterAddress: serviceCenter.address || '',
            serviceCenterCity: serviceCenter.city || '',
            serviceCenterState: serviceCenter.state || '',
            serviceCenterPinCode: serviceCenter.pinCode || '',
            serviceCenterPhone: serviceCenter.phone || '',
            serviceCenterEmail: serviceCenter.email || '',
            requestedBy: backendPO.requestedBy?.name || 'Unknown User',
            requestedAt: backendPO.createdAt,
            approvedBy: backendPO.approvedBy?.name,
            approvedAt: backendPO.approvedAt,
            totalAmount: Number(backendPO.totalAmount) || 0,
            items: backendPO.items?.map((item: any) => {
                // Handle both central inventory parts and service center inventory parts
                const centralPart = item.centralInventoryPartId ? partsMap.get(item.centralInventoryPartId) : null;
                const inventoryPart = item.inventoryPart; // Service center inventory part
                
                // Use stored part data from POItem, fallback to inventory part, then central part
                const partName = item.partName || inventoryPart?.partName || centralPart?.partName || 'Unknown Part';
                const partNumber = item.partNumber || inventoryPart?.partNumber || centralPart?.partNumber || '';
                
                return {
                    id: item.id,
                    itemId: item.id,
                    partId: item.inventoryPartId || item.centralInventoryPartId,
                    // Part Information (from stored POItem data)
                    partName: partName,
                    partNumber: partNumber,
                    oemPartNumber: item.oemPartNumber || inventoryPart?.oemPartNumber || null,
                    category: item.category || inventoryPart?.category || centralPart?.category || '',
                    originType: item.originType || inventoryPart?.originType || null,
                    description: item.description || inventoryPart?.description || null,
                    brandName: item.brandName || inventoryPart?.brandName || null,
                    variant: item.variant || inventoryPart?.variant || null,
                    partType: item.partType || inventoryPart?.partType || null,
                    color: item.color || inventoryPart?.color || null,
                    unit: item.unit || inventoryPart?.unit || null,
                    hsnCode: centralPart?.hsnCode || '',
                    // Quantity and Pricing
                    quantity: item.quantity,
                    requestedQty: item.quantity,
                    approvedQty: item.receivedQty || 0,
                    unitPrice: Number(item.unitPrice) || 0,
                    totalPrice: Number(item.unitPrice) * item.quantity,
                    status: backendPO.status === 'APPROVED' ? 'approved' : 'pending',
                    // Additional Information
                    urgency: item.urgency || 'medium',
                    notes: item.notes || ''
                };
            }) || [],
            priority: 'normal' as const
        };
    }
}

export const centralInventoryRepository = new CentralInventoryRepository();
