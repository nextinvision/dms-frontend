/**
 * Approvals Form Schema
 * Defines form structure for approval actions
 */

export interface ApprovalFormData {
  notes: string;
  assignedEngineer?: string;
  partQuantities: Record<string, number>;
}

export function getInitialApprovalFormData(): ApprovalFormData {
  return {
    notes: "",
    assignedEngineer: "",
    partQuantities: {},
  };
}

