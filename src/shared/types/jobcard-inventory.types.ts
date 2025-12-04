/**
 * Job Card Inventory Types
 */

export type PartsRequestStatus = "pending" | "approved" | "rejected";

export interface JobCardPartsRequest {
  id: string;
  jobCardId: string;
  vehicleId?: string;
  vehicleNumber?: string;
  customerName?: string;
  requestedBy: string;
  requestedAt: string;
  status: PartsRequestStatus;
  parts: Array<{
    partId: string;
    partName: string;
    quantity: number;
  }>;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  notes?: string;
}

