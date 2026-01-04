/**
 * Admin Approval Service
 * Migrated to use Backend APIs directly, replacing localStorage mock.
 */

import { apiClient } from "@/core/api/client";
import { centralInventoryRepository } from '@/core/repositories/central-inventory.repository';
import type { PartsIssue, PartsIssueFormData } from "@/shared/types/central-inventory.types";

class AdminApprovalService {

  /**
   * Create a parts issue request
   */
  async createPartsIssueRequest(formData: PartsIssueFormData, requestedBy: string): Promise<PartsIssue> {
    const { issue } = await centralInventoryRepository.createPartsIssue(formData, requestedBy);
    return issue;
  }

  /**
   * Get pending approvals from backend
   * Admin should see CIM_APPROVED issues (waiting for admin approval)
   */
  async getPendingApprovals(): Promise<PartsIssue[]> {
    try {
      // Fetch both PENDING_APPROVAL and CIM_APPROVED issues
      // Admin needs to approve CIM_APPROVED issues
      const [pendingResponse, cimApprovedResponse] = await Promise.all([
        apiClient.get<any>('/parts-issues', { params: { status: 'PENDING_APPROVAL', limit: 100 } }),
        apiClient.get<any>('/parts-issues', { params: { status: 'CIM_APPROVED', limit: 100 } })
      ]);

      // Handle pagination structure for both responses
      let pendingData = pendingResponse.data;
      if (pendingData && typeof pendingData === 'object' && 'data' in pendingData) {
        pendingData = pendingData.data;
      }

      let cimData = cimApprovedResponse.data;
      if (cimData && typeof cimData === 'object' && 'data' in cimData) {
        cimData = cimData.data;
      }

      const pendingList = Array.isArray(pendingData) ? pendingData : [];
      const cimList = Array.isArray(cimData) ? cimData : [];
      
      // Combine and map both lists, then filter out already approved/rejected issues
      const allIssues = [...pendingList, ...cimList];
      const mapped = allIssues.map(this.mapBackendIssueToFrontend);
      
      // Filter out issues that are already ADMIN_APPROVED, DISPATCHED, COMPLETED, or REJECTED
      return mapped.filter(issue => 
        issue.status !== 'admin_approved' && 
        issue.status !== 'dispatched' && 
        issue.status !== 'completed' &&
        issue.status !== 'admin_rejected' &&
        !issue.adminApproved &&
        !issue.adminRejected
      );
    } catch (e) {
      console.error("Failed to fetch pending approvals", e);
      return [];
    }
  }

  /**
   * Get all issues
   */
  async getAllIssues(): Promise<PartsIssue[]> {
    return centralInventoryRepository.getAllPartsIssues();
  }

  /**
   * Get issue by ID
   */
  async getIssueById(id: string): Promise<PartsIssue | null> {
    try {
      const response = await apiClient.get<any>(`/parts-issues/${id}`);
      return this.mapBackendIssueToFrontend(response.data);
    } catch (e) {
      return null;
    }
  }

  /**
   * Approve parts issue by admin
   * This calls the admin-approve endpoint which sets status to ADMIN_APPROVED
   */
  async approvePartsIssue(issueId: string, approvedBy: string, notes?: string): Promise<PartsIssue> {
    // Call the admin-approve endpoint (not the CIM approve endpoint)
    // This endpoint requires the issue to be in CIM_APPROVED status first
    const response = await apiClient.patch<any>(`/parts-issues/${issueId}/admin-approve`, {});
    
    // Handle response structure - could be response.data or response directly
    const issueData = response.data || response;
    const mapped = this.mapBackendIssueToFrontend(issueData);
    
    console.log('Admin approved issue:', { 
      issueId, 
      backendStatus: issueData.status, 
      mappedStatus: mapped.status,
      adminApproved: mapped.adminApproved 
    });
    
    return mapped;
  }

  /**
   * Reject parts issue
   */
  async rejectPartsIssue(issueId: string, rejectedBy: string, rejectionReason: string): Promise<PartsIssue> {
    const response = await apiClient.patch<any>(`/parts-issues/${issueId}/reject`, {
      reason: rejectionReason
    });
    return this.mapBackendIssueToFrontend(response.data);
  }

  /**
   * Resend to admin (Not supported by backend yet)
   */
  async resendToAdmin(issueId: string): Promise<PartsIssue> {
    console.warn("Resend not supported by backend. Please create a new request.");
    const issue = await this.getIssueById(issueId);
    return issue!;
  }

  /**
   * Issue/Dispatch parts
   */
  async issueApprovedParts(issueId: string, issuedBy: string): Promise<PartsIssue> {
    const response = await apiClient.patch<any>(`/parts-issues/${issueId}/dispatch`, {
      transportDetails: { dispatchedBy: issuedBy }
    });
    return this.mapBackendIssueToFrontend(response.data);
  }

  /**
   * Map backend entity to PartsIssue
   */
  private mapBackendIssueToFrontend(backendIssue: any): PartsIssue {
    const statusMap: Record<string, any> = {
      'PENDING_APPROVAL': 'pending_admin_approval',
      'CIM_APPROVED': 'cim_approved', // Central Inventory Manager approved
      'ADMIN_APPROVED': 'admin_approved', // Admin approved - ready to dispatch
      'DISPATCHED': 'dispatched',
      'COMPLETED': 'completed',
      'REJECTED': 'admin_rejected'
    };
    
    // Determine admin approval status
    const isAdminApproved = backendIssue.status === 'ADMIN_APPROVED' || backendIssue.status === 'DISPATCHED' || backendIssue.status === 'COMPLETED';
    const isAdminRejected = backendIssue.status === 'REJECTED';

    // Map items first to calculate total correctly
    const items = backendIssue.items?.map((item: any) => ({
      id: item.id,
      partId: item.centralInventoryPartId || item.partId,
      partName: item.centralInventoryPart?.partName || item.partName || "Unknown Part",
      partNumber: item.centralInventoryPart?.partNumber || item.partNumber || "",
      hsnCode: item.centralInventoryPart?.hsnCode || "",
      fromStock: item.centralInventoryPartId || item.fromStock,
      quantity: item.approvedQty || item.requestedQty || item.quantity || 0, // Use approvedQty if available
      requestedQty: item.requestedQty || item.quantity || 0,
      approvedQty: item.approvedQty || 0,
      issuedQty: item.issuedQty || 0,
      unitPrice: item.centralInventoryPart?.unitPrice || 0,
      totalPrice: (item.centralInventoryPart?.unitPrice || 0) * (item.approvedQty || item.requestedQty || item.quantity || 0),
      subPoNumber: item.subPoNumber, // Include sub-PO number
      dispatches: item.dispatches || [], // Include dispatch history
    })) || [];

    // Calculate total amount from items to prevent 'toLocaleString' undefined error
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);

    return {
      ...backendIssue,
      status: statusMap[backendIssue.status] || backendIssue.status?.toLowerCase(),
      items: items,
      totalAmount: totalAmount || 0, // CRITICAL FIX: Ensure totalAmount is never undefined
      // Set admin approval flags
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
      dispatchedDate: backendIssue.dispatchedDate,
    };
  }
}

export const adminApprovalService = new AdminApprovalService();
