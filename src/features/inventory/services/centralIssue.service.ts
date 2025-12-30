/**
 * Central Issue Service - Simplified version using backend API
 * Migrated from mock repository
 * Note: adminApproval.service.ts handles the complex workflow logic
 */

import { apiClient } from '@/core/api/client';
import type { PartsIssue, PartsIssueFormData } from '@/shared/types/central-inventory.types';

class CentralIssueService {
  /**
   * Create parts issue (simple version - backend handles stock updates)
   */
  async createPartsIssue(
    formData: PartsIssueFormData,
    issuedBy: string
  ): Promise<{ issue: PartsIssue; stockUpdates: any[] }> {
    // Backend endpoint would handle creating the issue and updating stock
    const response = await apiClient.post<{ issue: PartsIssue; stockUpdates: any[] }>(
      '/parts-issues',
      {
        ...formData,
        issuedBy,
      }
    );
    return response.data;
  }

  /**
   * Get all parts issues
   */
  async getAllPartsIssues(): Promise<PartsIssue[]> {
    try {
      const response = await apiClient.get<any>('/parts-issues');
      
      // Handle potential pagination wrapper
      let data = response.data;
      if (data && typeof data === 'object' && 'data' in data) {
        data = data.data;
      }
      
      const list = Array.isArray(data) ? data : [];
      return list.map(this.mapBackendIssueToFrontend);
    } catch (e) {
      console.error("Failed to fetch parts issues", e);
      return [];
    }
  }

  /**
   * Get parts issue by ID
   */
  async getPartsIssueById(id: string): Promise<PartsIssue> {
    const response = await apiClient.get<any>(`/parts-issues/${id}`);
    return this.mapBackendIssueToFrontend(response.data);
  }

  /**
   * Map backend entity to PartsIssue to ensure numeric fields exist
   */
  private mapBackendIssueToFrontend(backendIssue: any): PartsIssue {
    const statusMap: Record<string, any> = {
      'PENDING_APPROVAL': 'pending_admin_approval',
      'APPROVED': 'admin_approved',
      'REJECTED': 'admin_rejected',
      'DISPATCHED': 'issued',
      'COMPLETED': 'received'
    };

    // Map items first to calculate total correctly
    const items = backendIssue.items?.map((item: any) => ({
      id: item.id,
      partId: item.centralInventoryPartId || item.partId,
      partName: item.centralInventoryPart?.partName || item.partName || "Unknown Part",
      partNumber: item.centralInventoryPart?.partNumber || item.partNumber || "",
      hsnCode: item.centralInventoryPart?.hsnCode || "",
      fromStock: item.centralInventoryPartId || item.fromStock,
      quantity: item.requestedQty || item.quantity || 0,
      unitPrice: item.centralInventoryPart?.unitPrice || 0,
      totalPrice: (item.centralInventoryPart?.unitPrice || 0) * (item.requestedQty || item.quantity || 0),
    })) || [];

    // Explicitly calculate totalAmount to prevent crashes
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);

    return {
      ...backendIssue,
      status: statusMap[backendIssue.status] || backendIssue.status?.toLowerCase(),
      items: items,
      totalAmount: totalAmount || 0, // CRITICAL FIX: Ensure this is defined
    };
  }
}

export const centralIssueService = new CentralIssueService();
