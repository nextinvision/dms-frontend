/**
 * Invoice Type Definitions for Central Inventory
 */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceCenterId: string;
  serviceCenterName: string;
  partsIssueId: string;
  partsIssueNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  issuedBy: string;
  issuedAt: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  paymentScreenshot?: string; // Base64 or URL
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  paidBy?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface InvoiceFormData {
  partsIssueId: string;
  purchaseOrderId?: string;
  paymentScreenshot?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}
