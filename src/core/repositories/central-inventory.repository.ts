import { BaseRepository } from './base.repository';
import { apiClient } from '@/core/api/client';
import type { PartsIssue, PartsIssueFormData, ServiceCenterInfo, CentralInventoryStats } from '@/shared/types/central-inventory.types';
import type { ServiceCenter } from '@/shared/types/service-center.types';

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
     * Maps CentralInventoryItem to CentralStock format for compatibility
     */
    async getAllStock(): Promise<any[]> {
        const items = await this.getAll();
        // Map to CentralStock format expected by the frontend
        return items.map(item => ({
            id: item.id,
            partId: item.id, // Use same ID as partId for compatibility
            partName: item.partName,
            partNumber: item.partNumber,
            hsnCode: item.hsnCode || '',
            category: item.category,
            currentQty: item.stockQuantity, // Map stockQuantity to currentQty
            stockQuantity: item.stockQuantity, // Keep original for API calls
            allocated: item.allocated || 0,
            available: item.available || (item.stockQuantity - (item.allocated || 0)),
            minStock: item.reorderPoint || 0,
            maxStock: item.reorderQuantity || 0,
            unitPrice: item.unitPrice || 0,
            costPrice: item.unitPrice || 0, // Use unitPrice as costPrice if not available
            supplier: '',
            location: '',
            warehouse: '',
            status: (item.available || (item.stockQuantity - (item.allocated || 0))) <= (item.reorderPoint || 0) 
                ? 'Low Stock' 
                : (item.stockQuantity <= 0 ? 'Out of Stock' : 'In Stock'),
            lastUpdated: item.updatedAt || item.createdAt || new Date().toISOString(),
            lastUpdatedBy: '',
            ...item, // Include all other fields
        }));
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
     * Get parts issue by ID
     */
    async getPartsIssueById(id: string): Promise<PartsIssue | null> {
        try {
            const response = await apiClient.get<any>(`/parts-issues/${id}`);
            return this.mapBackendIssueToFrontend(response.data);
        } catch (error) {
            console.error(`Failed to fetch parts issue ${id}:`, error);
            return null;
        }
    }

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<CentralInventoryStats> {
        try {
            // Fetch all data in parallel
            const [stockItems, purchaseOrders, partsIssues, serviceCenters] = await Promise.all([
                this.getAllStock(),
                this.getAllPurchaseOrders(),
                this.getAllPartsIssues(),
                this.getAllServiceCenters(),
            ]);

            // Calculate stats from stock items
            const totalParts = stockItems.length;
            const totalStockValue = stockItems.reduce((sum, item) => {
                const qty = Number(item.stockQuantity || item.currentQty || 0);
                const price = Number(item.unitPrice || 0);
                return sum + (qty * price);
            }, 0);
            
            const lowStockParts = stockItems.filter((item) => {
                const qty = Number(item.stockQuantity || item.currentQty || 0);
                const reorderPoint = Number(item.reorderPoint || item.minStockLevel || 0);
                return qty > 0 && qty <= reorderPoint;
            }).length;
            
            const outOfStockParts = stockItems.filter((item) => {
                const qty = Number(item.stockQuantity || item.currentQty || 0);
                return qty === 0;
            }).length;

            // Calculate stats from purchase orders
            const pendingPurchaseOrders = purchaseOrders.filter((po) => 
                po.status === 'pending' || po.status === 'PENDING'
            ).length;
            
            const approvedPurchaseOrders = purchaseOrders.filter((po) => 
                po.status === 'approved' || po.status === 'APPROVED'
            ).length;

            // Calculate stats from parts issues
            const pendingIssues = partsIssues.filter((issue) => {
                const status = issue.status?.toLowerCase() || '';
                return status === 'pending' || 
                       status === 'pending_admin_approval' || 
                       status === 'cim_approved' ||
                       status === 'pending_approval';
            }).length;

            // Service centers count
            const totalServiceCenters = serviceCenters.length;

            // Recent activity (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentActivity = [
                ...purchaseOrders.filter((po) => {
                    const date = new Date(po.requestedAt || po.createdAt || 0);
                    return date >= sevenDaysAgo;
                }),
                ...partsIssues.filter((issue) => {
                    const date = new Date(issue.issuedAt || issue.createdAt || 0);
                    return date >= sevenDaysAgo;
                }),
            ].length;

            return {
                totalParts,
                totalStockValue,
                lowStockParts,
                outOfStockParts,
                pendingPurchaseOrders,
                approvedPurchaseOrders,
                pendingIssues,
                totalServiceCenters,
                recentActivity,
            };
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            // Return default stats on error
            return {
                totalParts: 0,
                totalStockValue: 0,
                lowStockParts: 0,
                outOfStockParts: 0,
                pendingPurchaseOrders: 0,
                approvedPurchaseOrders: 0,
                pendingIssues: 0,
                totalServiceCenters: 0,
                recentActivity: 0,
            };
        }
    }

    /**
     * Create parts issue
     */
    async createPartsIssue(data: PartsIssueFormData, issuedBy: string): Promise<{ issue: PartsIssue }> {
        // Validate that all items have valid fromStock IDs
        const invalidItems = data.items.filter(item => !item.fromStock || item.fromStock.trim() === '');
        if (invalidItems.length > 0) {
            throw new Error(`Invalid part IDs found. Please refresh the page and try again.`);
        }

        // Get all stock to ensure we have partNumber and partName
        const allStock = await this.getAllStock();
        
        // Map frontend form data to backend DTO with partNumber and partName for flexible matching
        const backendData = {
            toServiceCenterId: data.serviceCenterId,
            items: data.items.map(item => {
                // Find the stock item to get partNumber and partName
                // Try multiple matching strategies
                let stockItem = allStock.find(s => s.id === item.fromStock);
                if (!stockItem) {
                    stockItem = allStock.find(s => s.partId === item.fromStock);
                }
                if (!stockItem && item.partNumber) {
                    stockItem = allStock.find(s => 
                        s.partNumber === item.partNumber || 
                        (s as any).partCode === item.partNumber
                    );
                }
                if (!stockItem && item.partName) {
                    stockItem = allStock.find(s => s.partName === item.partName);
                }
                
                // Use partNumber and partName from form data, or from stock item, or undefined
                const partNumber = item.partNumber || stockItem?.partNumber || undefined;
                const partName = item.partName || stockItem?.partName || undefined;
                
                console.log(`Mapping item for backend:`, {
                    fromStock: item.fromStock,
                    partNumber: partNumber,
                    partName: partName,
                    foundInStock: !!stockItem
                });
                
                return {
                    centralInventoryPartId: item.fromStock,
                    requestedQty: item.quantity,
                    partNumber: partNumber,
                    partName: partName
                };
            })
        };

        try {
            const response = await apiClient.post<any>('/parts-issues', backendData);
            return { issue: this.mapBackendIssueToFrontend(response.data) };
        } catch (error: any) {
            // Provide user-friendly error messages
            if (error?.message?.includes('not found in central inventory')) {
                throw new Error('One or more parts were not found. Please refresh the page and try again.');
            }
            throw error;
        }
    }

    private mapBackendIssueToFrontend(backendIssue: any): PartsIssue {
        const statusMap: Record<string, any> = {
            'PENDING_APPROVAL': 'pending_admin_approval',
            'CIM_APPROVED': 'cim_approved', // Central Inventory Manager approved
            'ADMIN_APPROVED': 'admin_approved', // Admin approved - ready to dispatch
            'DISPATCHED': 'issued',
            'COMPLETED': 'received',
            'REJECTED': 'admin_rejected'
        };

        // Determine admin approval status based on backend status
        const isAdminApproved = backendIssue.status === 'ADMIN_APPROVED' || backendIssue.status === 'DISPATCHED' || backendIssue.status === 'COMPLETED';
        const isAdminRejected = backendIssue.status === 'REJECTED';
        const isPending = backendIssue.status === 'PENDING_APPROVAL' || backendIssue.status === 'CIM_APPROVED';

        // Map items with proper structure
        const items = backendIssue.items?.map((item: any) => {
            // Ensure requestedQty is always taken from the backend item, never fallback to quantity
            // The backend should always have requestedQty set correctly
            const requestedQty = Number(item.requestedQty) || 0;
            const approvedQty = Number(item.approvedQty) || 0;
            const issuedQty = Number(item.issuedQty) || 0;
            
            // Log if requestedQty seems incorrect (for debugging)
            if (requestedQty === 0 && item.quantity && item.quantity > 0) {
                console.warn(
                    `Parts issue item ${item.id}: requestedQty is 0 but quantity is ${item.quantity}. ` +
                    `This might indicate a data issue.`
                );
            }
            
            return {
                id: item.id,
                partId: item.centralInventoryPartId || item.partId,
                partName: item.centralInventoryPart?.partName || item.partName || "Unknown Part",
                partNumber: item.centralInventoryPart?.partNumber || item.partNumber || "",
                hsnCode: item.centralInventoryPart?.hsnCode || "",
                fromStock: item.centralInventoryPartId || item.fromStock,
                quantity: approvedQty || requestedQty || 0, // Use approvedQty if available, otherwise requestedQty
                requestedQty: requestedQty, // Always use the actual requestedQty from backend, no fallback
                approvedQty: approvedQty,
                issuedQty: issuedQty,
                unitPrice: item.centralInventoryPart?.unitPrice || 0,
                totalPrice: (item.centralInventoryPart?.unitPrice || 0) * (approvedQty || requestedQty || 0),
                subPoNumber: item.subPoNumber, // Include sub-PO number
                dispatches: item.dispatches || [], // Include dispatch history
            };
        }) || [];

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);

        return {
            ...backendIssue,
            status: statusMap[backendIssue.status] || backendIssue.status?.toLowerCase(),
            items: items,
            totalAmount: totalAmount || 0,
            // Include purchaseOrderId if present
            purchaseOrderId: backendIssue.purchaseOrderId || undefined,
            // Set admin approval flags based on status
            adminApproved: isAdminApproved,
            adminRejected: isAdminRejected,
            adminApprovedBy: isAdminApproved ? (backendIssue.requestedBy?.name || backendIssue.requestedBy || 'Admin') : undefined,
            adminApprovedAt: isAdminApproved ? (backendIssue.updatedAt || backendIssue.createdAt) : undefined,
            adminRejectedBy: isAdminRejected ? (backendIssue.requestedBy?.name || backendIssue.requestedBy || 'Admin') : undefined,
            adminRejectedAt: isAdminRejected ? (backendIssue.updatedAt || backendIssue.createdAt) : undefined,
            // Service center info
            serviceCenterName: backendIssue.toServiceCenter?.name || backendIssue.serviceCenterName,
            serviceCenterId: backendIssue.toServiceCenterId || backendIssue.serviceCenterId,
            // Request info
            issuedBy: backendIssue.requestedBy?.name || backendIssue.requestedBy || 'Unknown',
            issuedAt: backendIssue.createdAt,
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

    /**
     * Get all service centers
     * Maps ServiceCenter to ServiceCenterInfo format
     */
    async getAllServiceCenters(): Promise<ServiceCenterInfo[]> {
        const response = await apiClient.get<ServiceCenter[]>('/service-centers');
        const serviceCenters = Array.isArray(response.data) ? response.data : [];
        
        return serviceCenters.map((sc: ServiceCenter): ServiceCenterInfo => ({
            id: sc.id,
            name: sc.name,
            location: sc.city || sc.address || undefined,
            contactPerson: undefined, // Not available in ServiceCenter type
            contactEmail: sc.email || undefined,
            contactPhone: sc.phone || undefined,
            active: sc.status === 'Active' || sc.status === 'active'
        }));
    }

    /**
     * Adjust stock quantity
     * Supports add, remove, and adjust operations
     * Returns stock in CentralStock format for compatibility
     */
    async adjustStock(
        stockId: string,
        adjustment: {
            adjustmentType: 'add' | 'remove' | 'adjust';
            quantity: number;
            reason: string;
            notes?: string;
            referenceNumber?: string;
        },
        adjustedBy: string
    ): Promise<{ stock: any; adjustment: any }> {
        // Get current stock to calculate new quantity
        const currentStock = await this.getById(stockId);
        if (!currentStock) {
            throw new Error('Stock not found');
        }

        let newQuantity: number;
        const currentQty = currentStock.stockQuantity || currentStock.currentQty || 0;
        const allocated = currentStock.allocated || 0;

        switch (adjustment.adjustmentType) {
            case 'add':
                // Use the add endpoint
                const addResponse = await apiClient.patch<CentralInventoryItem>(
                    `${this.endpoint}/${stockId}/stock/add`,
                    { quantity: adjustment.quantity }
                );
                const addedStock = addResponse.data;
                return {
                    stock: {
                        ...addedStock,
                        currentQty: addedStock.stockQuantity,
                        partId: addedStock.id,
                    },
                    adjustment: {
                        id: `adj-${Date.now()}`,
                        stockId,
                        adjustmentType: adjustment.adjustmentType,
                        quantity: adjustment.quantity,
                        previousQty: currentQty,
                        newQty: currentQty + adjustment.quantity,
                        reason: adjustment.reason,
                        notes: adjustment.notes,
                        referenceNumber: adjustment.referenceNumber,
                        adjustedBy,
                        adjustedAt: new Date().toISOString(),
                    }
                };

            case 'remove':
                newQuantity = Math.max(0, currentQty - adjustment.quantity);
                // Validate we're not removing more than available
                const available = currentQty - allocated;
                if (adjustment.quantity > available) {
                    throw new Error(`Cannot remove ${adjustment.quantity} units. Only ${available} units available (${currentQty} total - ${allocated} allocated).`);
                }
                break;

            case 'adjust':
                newQuantity = adjustment.quantity;
                // Validate new quantity is not less than allocated
                if (newQuantity < allocated) {
                    throw new Error(`Cannot set stock to ${newQuantity}. There are ${allocated} units already allocated.`);
                }
                break;

            default:
                throw new Error(`Unknown adjustment type: ${adjustment.adjustmentType}`);
        }

        // For remove and adjust, use the update endpoint
        const updateResponse = await apiClient.patch<CentralInventoryItem>(
            `${this.endpoint}/${stockId}/stock`,
            { stockQuantity: newQuantity }
        );

        const updatedStock = updateResponse.data;
        return {
            stock: {
                ...updatedStock,
                currentQty: updatedStock.stockQuantity,
                partId: updatedStock.id,
            },
            adjustment: {
                id: `adj-${Date.now()}`,
                stockId,
                adjustmentType: adjustment.adjustmentType,
                quantity: adjustment.adjustmentType === 'remove' 
                    ? adjustment.quantity 
                    : newQuantity - currentQty,
                previousQty: currentQty,
                newQty: newQuantity,
                reason: adjustment.reason,
                notes: adjustment.notes,
                referenceNumber: adjustment.referenceNumber,
                adjustedBy,
                adjustedAt: new Date().toISOString(),
            }
        };
    }
}

export const centralInventoryRepository = new CentralInventoryRepository();
