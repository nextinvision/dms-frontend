/**
 * Status constants
 */

export const JOB_CARD_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ON_HOLD: "on_hold",
  AWAITING_PARTS: "awaiting_parts",
  AWAITING_APPROVAL: "awaiting_approval",
  INSPECTION: "inspection",
  READY_FOR_DELIVERY: "ready_for_delivery",
} as const;

export const SERVICE_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const INVOICE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type JobCardStatus = typeof JOB_CARD_STATUS[keyof typeof JOB_CARD_STATUS];
export type ServiceRequestStatus = typeof SERVICE_REQUEST_STATUS[keyof typeof SERVICE_REQUEST_STATUS];
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];
export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

