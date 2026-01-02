/**
 * Inventory Manager Purchase Order Service
 * Handles Purchase Order creation and management for Service Center Inventory Managers
 */

import { purchaseOrderRepository, type CreatePurchaseOrderDto } from '@/core/repositories/purchase-order.repository';
import { inventoryRepository } from '@/core/repositories/inventory.repository';
import { getServiceCenterContext } from '@/shared/lib/serviceCenter';
import { useAuthStore } from '@/store/authStore';
import type { PartsOrderItem } from '@/app/inventory-manager/parts-order-entry/form.schema';

export interface InventoryPurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  items: PartsOrderItem[];
  orderNotes?: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

class InventoryPurchaseOrderService {
  /**
   * Get service center inventory parts for selection
   */
  async getCentralInventoryParts() {
    const context = getServiceCenterContext();
    if (!context.serviceCenterId) {
      throw new Error('Service Center ID not found. Please ensure you are logged in.');
    }
    // Fetch service center inventory parts
    const parts = await inventoryRepository.getAll({ serviceCenterId: context.serviceCenterId });
    // Map to expected format (matching CentralInventoryItem interface)
    return parts.map((part: any) => ({
      id: part.id,
      partName: part.partName,
      partNumber: part.partNumber || '',
      category: part.category || '',
      unitPrice: Number(part.unitPrice || 0), // Sale price
      costPrice: Number(part.costPrice || 0), // Purchase price
      gstRate: part.gstRate || 18,
      stockQuantity: part.stockQuantity || 0,
      available: part.stockQuantity || 0, // Available stock
      minStockLevel: part.minStockLevel || 0,
    }));
  }

  /**
   * Create a purchase order from service center inventory manager
   */
  async create(
    items: PartsOrderItem[],
    orderNotes?: string
  ): Promise<InventoryPurchaseOrder> {
    const context = getServiceCenterContext();
    const { userInfo } = useAuthStore.getState();
    
    if (!context.serviceCenterId) {
      throw new Error('Service Center ID not found. Please ensure you are logged in.');
    }

    // Fetch service center inventory parts to get pricing and GST info
    const inventoryParts = await inventoryRepository.getAll({ serviceCenterId: context.serviceCenterId });
    const partsMap = new Map(inventoryParts.map(p => [p.id, p]));

    // Map items to backend format with pricing from service center inventory
    const backendItems = items.map(item => {
      const inventoryPart = partsMap.get(item.partId);
      if (!inventoryPart) {
        throw new Error(`Part ${item.partId} not found in service center inventory`);
      }

      // Use costPrice for purchase orders (what we pay to buy the part)
      const costPrice = Number((inventoryPart as any).costPrice || 0);
      if (costPrice === 0) {
        throw new Error(`Part ${item.partName} does not have a cost price set. Please set the cost price in inventory master.`);
      }

      return {
        inventoryPartId: item.partId,
        // Part Information - send all fields from inventory
        partName: inventoryPart.partName,
        partNumber: inventoryPart.partNumber || null,
        oemPartNumber: (inventoryPart as any).oemPartNumber || null,
        category: inventoryPart.category || null,
        originType: (inventoryPart as any).originType || null,
        description: (inventoryPart as any).description || null,
        brandName: (inventoryPart as any).brandName || null,
        variant: (inventoryPart as any).variant || null,
        partType: (inventoryPart as any).partType || null,
        color: (inventoryPart as any).color || null,
        unit: (inventoryPart as any).unit || null,
        // Quantity and Pricing
        quantity: item.requiredQty,
        unitPrice: costPrice, // Use cost price for purchase orders
        gstRate: (inventoryPart as any).gstRate || 18,
        // Additional Information
        urgency: item.urgency,
        notes: item.notes,
      };
    });

    const createDto: CreatePurchaseOrderDto = {
      fromServiceCenterId: context.serviceCenterId,
      requestedById: userInfo?.id,
      orderDate: new Date().toISOString(),
      items: backendItems,
      paymentTerms: orderNotes,
      orderNotes: orderNotes,
    };

    const created = await purchaseOrderRepository.create(createDto);
    
    // Map backend response to frontend format
    return this.mapToFrontendFormat(created, inventoryParts);
  }

  /**
   * Submit purchase order for approval
   */
  async submit(id: string): Promise<InventoryPurchaseOrder> {
    const context = getServiceCenterContext();
    const inventoryParts = await inventoryRepository.getAll({ serviceCenterId: context.serviceCenterId });
    const submitted = await purchaseOrderRepository.submit(id);
    return this.mapToFrontendFormat(submitted, inventoryParts);
  }

  /**
   * Get all purchase orders for current service center
   */
  async getAll(): Promise<InventoryPurchaseOrder[]> {
    const context = getServiceCenterContext();
    
    if (!context.serviceCenterId) {
      return [];
    }

    const orders = await purchaseOrderRepository.getByServiceCenter(context.serviceCenterId);
    const inventoryParts = await inventoryRepository.getAll({ serviceCenterId: context.serviceCenterId });
    return orders.map(order => this.mapToFrontendFormat(order, inventoryParts));
  }

  /**
   * Get purchase order by ID
   */
  async getById(id: string): Promise<InventoryPurchaseOrder> {
    const context = getServiceCenterContext();
    const order = await purchaseOrderRepository.getById(id);
    const inventoryParts = await inventoryRepository.getAll({ serviceCenterId: context.serviceCenterId });
    return this.mapToFrontendFormat(order, inventoryParts);
  }

  /**
   * Map backend PurchaseOrder to frontend InventoryPurchaseOrder format
   */
  private mapToFrontendFormat(order: any, inventoryParts: any[]): InventoryPurchaseOrder {
    const partsMap = new Map(inventoryParts.map(p => [p.id, p]));

    // Ensure items is an array, even if undefined
    const items = Array.isArray(order.items) ? order.items : [];

    return {
      id: order.id,
      poNumber: order.poNumber,
      status: order.status?.toLowerCase() || 'draft',
      items: items.map((item: any) => {
        const inventoryPart = item.inventoryPart || (item.inventoryPartId ? partsMap.get(item.inventoryPartId) : null);
        return {
          partId: item.inventoryPartId || item.centralInventoryPartId || '',
          partName: item.partName || inventoryPart?.partName || 'Unknown Part',
          requiredQty: item.quantity || 0,
          urgency: (item.urgency || 'medium') as 'low' | 'medium' | 'high',
          notes: item.notes || '',
        };
      }),
      orderNotes: order.orderNotes || order.paymentTerms || '',
      requestedBy: order.requestedBy?.name || 'Unknown',
      requestedAt: order.createdAt || new Date().toISOString(),
      approvedBy: order.approvedBy?.name,
      approvedAt: order.approvedAt,
    };
  }
}

export const inventoryPurchaseOrderService = new InventoryPurchaseOrderService();

