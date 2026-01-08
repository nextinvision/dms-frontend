/**
 * Hook for managing parts approval requests
 * Refactored to use JobCardService for Job Card Parts Requests
 */

import { useState, useEffect, useCallback } from "react";
import type { JobCardPartsRequest } from "@/shared/types/jobcard-inventory.types";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { useRole } from "./useRole"; // Assuming in same directory or adjust import

// Helper to map Backend PartsRequest to Frontend JobCardPartsRequest
const mapPartsRequestToFrontend = (req: any): JobCardPartsRequest => {
  const status = req.status;
  const isScApproved = status === 'APPROVED' || status === 'COMPLETED' || status === 'PARTIALLY_APPROVED';
  const isIssued = status === 'COMPLETED';

  return {
    id: req.id,
    jobCardId: req.jobCard?.jobCardNumber || req.jobCardId,
    vehicleNumber: req.jobCard?.vehicle?.registration || req.jobCard?.vehicle?.vehicleMake || "N/A",
    customerName: req.jobCard?.customer?.name || "N/A",
    requestedBy: req.jobCard?.assignedEngineer?.name || "Service Engineer",
    requestedAt: req.createdAt,
    status: status === 'COMPLETED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    parts: (req.items || []).map((item: any) => ({
      partId: item.id,
      partName: item.partName || `Part #${item.partNumber}`,
      quantity: item.requestedQty || item.quantity,
      isWarranty: item.isWarranty,
      serialNumber: item.partNumber
    })),
    scManagerApproved: isScApproved,
    scManagerApprovedBy: isScApproved ? "SC Manager" : undefined,
    scManagerApprovedAt: isScApproved ? req.updatedAt : undefined,
    inventoryManagerAssigned: isIssued,
    assignedEngineer: isIssued ? (req.jobCard?.assignedEngineer?.name || "Engineer") : undefined
  };
};

export function usePartsApproval() {
  const { userInfo } = useRole();
  const [pendingRequests, setPendingRequests] = useState<JobCardPartsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      // Fetch parts requests via JobCardService
      const allRequestsData = await jobCardService.getPendingPartsRequests(userInfo?.serviceCenterId?.toString() || undefined);
      const allRequests = allRequestsData.map(mapPartsRequestToFrontend);

      // Filter for requests that need attention:
      // 1. Pending SC Approval (status != 'approved/rejected' and !scManagerApproved)
      // 2. SC Approved but not Issued (scManagerApproved and !inventoryManagerAssigned)
      // We want to show pending count.
      // Dashboard usually shows "Actionable" items.
      const pending = allRequests.filter((r) =>
        (r.status !== 'REJECTED') &&
        (!r.scManagerApproved || (!r.inventoryManagerAssigned && r.scManagerApproved))
      );

      setPendingRequests(pending);
    } catch (error) {
      console.error("Failed to load parts approval requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.serviceCenterId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadRequests();
      const interval = setInterval(loadRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [loadRequests]);

  const approve = useCallback(async (id: string, approvedBy: string, notes?: string) => {
    try {
      // 'Approve' generic action. 
      // If we are implicitly 'approving' in dashboard, it might mean Issue or Sc Approve.
      // But typically this hook might be used by generic component. 
      // For safety, let's assume 'APPROVED' status update (SC Manager step).
      // If Inventory Manager uses it, they usually 'Issue'.
      // If we simply set status APPROVED, it moves to next step.
      await jobCardService.updatePartsRequestStatus(id, 'APPROVED', notes);
      await loadRequests();
    } catch (error) {
      console.error("Failed to approve request:", error);
      throw error;
    }
  }, [loadRequests]);

  const reject = useCallback(async (id: string, rejectedBy: string, notes?: string) => {
    try {
      await jobCardService.updatePartsRequestStatus(id, 'REJECTED', notes);
      await loadRequests();
    } catch (error) {
      console.error("Failed to reject request:", error);
      throw error;
    }
  }, [loadRequests]);

  return {
    pendingRequests,
    isLoading,
    approve,
    reject,
    refresh: loadRequests,
  };
}
