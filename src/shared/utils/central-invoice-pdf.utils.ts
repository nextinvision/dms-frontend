/**
 * Central Inventory Invoice PDF Generator
 * Converts Invoice (from parts issues) to PDF format
 */

import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/shared/components/invoice/InvoicePDFDocument";
import type { Invoice } from "@/shared/types/invoice.types";
import type { ServiceCenterInvoice } from "@/shared/types/invoice.types";
import { generateInvoiceHTML } from "./invoicePDF.utils";

/**
 * Convert Invoice to ServiceCenterInvoice format for PDF generation
 */
export function convertInvoiceToServiceCenterInvoice(invoice: Invoice): ServiceCenterInvoice {
  // Calculate GST if not provided (assume 18% if missing)
  const defaultGstRate = 18;

  // Map items with GST calculations
  const items = invoice.items.map(item => {
    const unitPrice = item.unitPrice;
    const quantity = item.quantity;
    const taxableAmount = item.totalPrice;
    const gstRate = defaultGstRate; // Default GST rate, should ideally come from part data
    const gstAmount = (taxableAmount * gstRate) / (100 + gstRate);
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const totalAmount = item.totalPrice;

    return {
      name: item.partName,
      qty: quantity,
      price: totalAmount.toString(),
      hsnSacCode: item.hsnCode || '',
      unitPrice: unitPrice,
      quantity: quantity,
      taxableAmount: taxableAmount - gstAmount, // Taxable amount before GST
      gstRate: gstRate,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: 0,
      totalAmount: totalAmount,
    };
  });

  // Calculate totals
  const subtotal = invoice.subtotal || invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalTax = invoice.tax || (totalCgst + totalSgst);
  const grandTotal = invoice.totalAmount;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.serviceCenterName,
    vehicle: `Parts Issue: ${invoice.partsIssueNumber}${invoice.purchaseOrderNumber ? ` | PO: ${invoice.purchaseOrderNumber}` : ''}`,
    date: invoice.issuedAt,
    dueDate: invoice.issuedAt, // Can be calculated based on payment terms
    amount: grandTotal.toString(),
    paidAmount: invoice.status === 'paid' ? grandTotal.toString() : '0',
    balance: invoice.status === 'paid' ? '0' : grandTotal.toString(),
    status: mapInvoiceStatusToPaymentStatus(invoice.status),
    paymentMethod: invoice.paymentMethod || null,
    serviceCenterId: invoice.serviceCenterId,
    serviceCenterName: invoice.serviceCenterName,
    items: items,
    subtotal: subtotal - totalTax, // Subtotal before tax
    totalTaxableAmount: subtotal - totalTax,
    totalCgst: totalCgst,
    totalSgst: totalSgst,
    totalIgst: 0,
    totalTax: totalTax,
    grandTotal: grandTotal,
    termsAndConditions: invoice.notes ? [invoice.notes] : [],
    createdBy: invoice.createdBy || invoice.issuedBy,
    enhancedItems: items.map(item => ({
      name: item.name,
      hsnSacCode: item.hsnSacCode,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      taxableAmount: item.taxableAmount,
      gstRate: item.gstRate,
      cgstAmount: item.cgstAmount,
      sgstAmount: item.sgstAmount,
      igstAmount: 0,
      totalAmount: item.totalAmount,
    })),
  };
}

function mapInvoiceStatusToPaymentStatus(status: Invoice['status']): 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid' {
  const statusMap: Record<Invoice['status'], 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid'> = {
    'draft': 'Unpaid',
    'sent': 'Unpaid',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Unpaid',
  };
  return statusMap[status] || 'Unpaid';
}

/**
 * Generate invoice HTML for central inventory invoices
 */
export function generateCentralInvoiceHTML(invoice: Invoice): string {
  const serviceCenterInvoice = convertInvoiceToServiceCenterInvoice(invoice);
  return generateInvoiceHTML(serviceCenterInvoice);
}

/**
 * Download invoice as PDF using React-PDF
 */
export async function downloadCentralInvoicePDF(invoice: Invoice): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Convert Invoice to ServiceCenterInvoice format
    const serviceCenterInvoice = convertInvoiceToServiceCenterInvoice(invoice);

    // Generate PDF blob using React-PDF
    const blob = await pdf(
      React.createElement(InvoicePDFDocument, { invoice: serviceCenterInvoice }) as any
    ).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    // Fallback to HTML print if PDF generation fails
    const invoiceHTML = generateCentralInvoiceHTML(invoice);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert("Please allow popups to download the invoice");
    }
  }
}

/**
 * Print invoice using React-PDF
 */
export async function printCentralInvoice(invoice: Invoice): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { pdf } = await import("@react-pdf/renderer");
    const { InvoicePDFDocument } = await import("@/shared/components/invoice/InvoicePDFDocument");
    const React = await import("react");

    // Convert Invoice to ServiceCenterInvoice format
    const serviceCenterInvoice = convertInvoiceToServiceCenterInvoice(invoice);

    // Generate PDF blob using React-PDF for proper text-based PDF
    const blob = await pdf(
      React.createElement(InvoicePDFDocument, { invoice: serviceCenterInvoice }) as any
    ).toBlob();

    // Open PDF in new window/tab for printing
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      // Wait for PDF to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Clean up URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }, 500);
      };
    } else {
      // Fallback: if popup blocked
      alert("Popup blocked. Please allow popups to print, or use Download PDF instead.");
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to generate PDF for printing:", error);
    // Fallback to HTML print
    const invoiceHTML = generateCentralInvoiceHTML(invoice);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  }
}

