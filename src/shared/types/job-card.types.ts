/**
 * Job Card Type Definitions
 */

import type { ServiceLocation, Priority } from './common.types';

export type JobCardStatus =
  | "arrival_pending"
  | "job_card_pending_vehicle"
  | "job_card_active"
  | "check_in_only"
  | "no_response_lead"
  | "manager_quote"
  | "Created"
  | "Assigned"
  | "In Progress"
  | "Parts Pending"
  | "Completed"
  | "Invoiced";

export interface JobCard {
  id: string;
  jobCardNumber: string; // Format: SC001-2025-11-0001
  serviceCenterId: string;
  serviceCenterCode?: string; // e.g., "SC001"
  customerId: string;
  customerName: string;
  vehicleId?: string;
  vehicle: string;
  registration: string;
  vehicleMake?: string;
  vehicleModel?: string;
  customerType?: "B2C" | "B2B";
  serviceType: string;
  description: string;
  status: JobCardStatus;
  priority: Priority;
  assignedEngineer: string | null;
  estimatedCost: string;
  estimatedTime: string;
  startTime?: string;
  createdAt: string;
  completedAt?: string;
  parts: string[];
  location: ServiceLocation;
  quotationId?: string;
  workflowState?: JobCardStatus;
  arrivalMode?: "vehicle_present" | "vehicle_absent" | "check_in_only";
  dualApproval?: {
    technicianApproved?: boolean;
    serviceManagerApproved?: boolean;
    inventoryApproved?: boolean;
  };
  partRequestStatus?: "pending" | "service_manager_approved" | "inventory_manager_approved" | "n/a";
  partRequests?: string[];
  technicianNotes?: string;
  workCompletionNotified?: boolean;
  // Insurance details
  hasInsurance?: boolean;
  insurerName?: string;
  insurerAddress?: string;
  insurerGstNumber?: string;
  // Part pending status
  partsPending?: boolean;
  // Warranty information
  warrantyStatus?: string;
  warrantyDetails?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: JobCardStatus;
}

