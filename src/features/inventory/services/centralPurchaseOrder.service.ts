/**
 * Central Purchase Order Service - Business logic layer for purchase order operations
 * Migrated to use backend API
 */

import { purchaseOrderRepository } from '@/core/repositories/purchase-order.repository';
import type { PurchaseOrder } from "@/shared/types/central-inventory.types";

class CentralPurchaseOrderService {
  /**
   * Get all purchase orders
   */
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    const orders = await purchaseOrderRepository.getAll();
    return (orders || []).map(this.mapBackendOrderToFrontend);
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const order = await purchaseOrderRepository.getById(id);
    return this.mapBackendOrderToFrontend(order);
  }

  /**
   * Approve purchase order
   */
  async approvePurchaseOrder(
    id: string,
    approvedBy: string,
    approvedItems?: Array<{ itemId: string; approvedQty: number }>
  ): Promise<PurchaseOrder> {
    // Backend approve endpoint handles the logic
    const approved = await purchaseOrderRepository.approve(id);
    return this.mapBackendOrderToFrontend(approved);
  }

  /**
   * Reject purchase order
   */
  async rejectPurchaseOrder(
    id: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<PurchaseOrder> {
    // For now, we update the status - backend would have reject endpoint
    const updated = await purchaseOrderRepository.update(id, {
      status: 'Cancelled',
    } as any);
    return this.mapBackendOrderToFrontend(updated);
  }

  /**
   * Get purchase orders by status
   */
  async getPurchaseOrdersByStatus(status: PurchaseOrder["status"]): Promise<PurchaseOrder[]> {
    const orders = await purchaseOrderRepository.getByStatus(status);
    return (orders || []).map(this.mapBackendOrderToFrontend);
  }

  /**
   * Get purchase orders by service center
   */
  async getPurchaseOrdersByServiceCenter(serviceCenterId: string): Promise<PurchaseOrder[]> {
    const orders = await purchaseOrderRepository.getAll({ serviceCenterId });
    return (orders || []).map(this.mapBackendOrderToFrontend);
  }

  /**
   * Map backend order to frontend to ensure totalAmount exists
   */
  private mapBackendOrderToFrontend(backendOrder: any): PurchaseOrder {
    if (!backendOrder) return backendOrder;

    const items = backendOrder.items?.map((item: any) => ({
      ...item,
      // Ensure numeric fields are safe
      unitPrice: Number(item.unitPrice) || 0,
      requestedQty: Number(item.requestedQty) || 0,
      totalPrice: (Number(item.unitPrice) || 0) * (Number(item.requestedQty) || 0)
    })) || [];

    // Calculate total if missing
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    return {
      ...backendOrder,
      items: items,
      totalAmount: backendOrder.totalAmount !== undefined ? Number(backendOrder.totalAmount) : calculatedTotal
    } as PurchaseOrder;
  }
}

export const centralPurchaseOrderService = new CentralPurchaseOrderService();
