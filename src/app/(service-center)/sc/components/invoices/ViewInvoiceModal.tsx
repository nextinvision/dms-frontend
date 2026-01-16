/**
 * View Invoice Modal Component
 * Displays invoice details with print, download, and WhatsApp sharing options
 */

import React from "react";
import { Printer, Download, MessageCircle, X } from "lucide-react";
import InvoicePDF from "../../../../../components/invoice/InvoicePDF";
import type { ServiceCenterInvoice } from "@/shared/types/invoice.types";
import { generateInvoiceHTML } from "@/shared/utils/invoicePDF.utils";

interface ViewInvoiceModalProps {
  invoice: ServiceCenterInvoice;
  onClose: () => void;
  onSendToCustomer?: () => void;
}

export default function ViewInvoiceModal({
  invoice,
  onClose,
  onSendToCustomer,
}: ViewInvoiceModalProps) {
  // ViewInvoiceModal just wraps InvoicePDF component which handles print/download
  // No need for separate handlers here
  return (
    <InvoicePDF
      invoice={invoice}
      onClose={onClose}
      showActions={true}
      onSendToCustomer={onSendToCustomer}
    />
  );
}

