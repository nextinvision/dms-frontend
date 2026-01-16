/**
 * Invoice PDF HTML Generator
 * Generates HTML matching the exact PDF format for printing/downloading
 */

import type { ServiceCenterInvoice, EnhancedServiceCenterInvoiceItem } from "@/shared/types/invoice.types";

/**
 * Generate invoice HTML for printing/downloading as PDF
 * @param invoice - Invoice data
 * @returns HTML string for invoice
 */
export function generateInvoiceHTML(invoice: ServiceCenterInvoice, signatureUrl?: string): string {
  const serviceCenter = invoice.serviceCenterDetails;
  const customer = invoice.customerDetails;

  // Use enhanced items if available, otherwise fall back to legacy items
  const items: EnhancedServiceCenterInvoiceItem[] = invoice.enhancedItems || [];
  const hasEnhancedItems = items.length > 0;

  // Calculate totals
  const subtotal = invoice.subtotal ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.taxableAmount, 0) : 0);
  const totalCgst = invoice.totalCgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.cgstAmount, 0) : 0);
  const totalSgst = invoice.totalSgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.sgstAmount, 0) : 0);
  const totalIgst = invoice.totalIgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.igstAmount, 0) : 0);
  const totalTax = invoice.totalTax ?? (totalCgst + totalSgst + totalIgst);
  const discount = invoice.discount ?? 0;
  const roundOff = invoice.roundOff ?? 0;
  const grandTotal = invoice.grandTotal ?? (subtotal + totalTax - discount + roundOff);

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Generate items table rows - Updated: Removed HSN/SAC column
  const itemsRows = hasEnhancedItems && items.length > 0
    ? items
      .map(
        (item, index) => {
          const cgstRate = totalIgst > 0 || item.taxableAmount === 0 ? 0 : Math.round((item.cgstAmount / item.taxableAmount) * 100);
          const sgstRate = totalIgst > 0 || item.taxableAmount === 0 ? 0 : Math.round((item.sgstAmount / item.taxableAmount) * 100);

          return `
      <tr>
        <td style="border: 1px solid #1f2937; padding: 6px; font-size: 11px;">${item.name || "-"}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: center; font-size: 11px;">${(item.quantity || 0).toFixed(2)} pcs</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">₹${(item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">${totalIgst > 0 ? "-" : `${cgstRate}% (Amt: ₹${(item.cgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })})`}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">${totalIgst > 0 ? "-" : `${sgstRate}% (Amt: ₹${(item.sgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })})`}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">₹${(item.taxableAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
        }
      )
      .join("")
    : (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0)
      ? invoice.items
        .map(
          (item, index) => {
            const qty = typeof item.qty === 'number' ? item.qty : (typeof item.quantity === 'number' ? item.quantity : 1);
            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
            const totalAmount = typeof item.totalAmount === 'number' ? item.totalAmount :
              (typeof item.price === 'string' ? parseFloat(item.price.replace(/[₹,]/g, '')) : 0);
            const taxableAmount = unitPrice * qty;
            const gstRate = item.gstRate || 18;
            const taxAmount = totalAmount - taxableAmount;
            const cgstAmount = taxAmount / 2;
            const sgstAmount = taxAmount / 2;
            const cgstRate = Math.round(gstRate / 2);
            const sgstRate = Math.round(gstRate / 2);

            return `
      <tr>
        <td style="border: 1px solid #1f2937; padding: 6px; font-size: 11px;">${item.name || "-"}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: center; font-size: 11px;">${qty.toFixed(2)} pcs</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">${unitPrice > 0 ? "₹" + unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">${totalIgst > 0 ? "-" : `${cgstRate}% (Amt: ₹${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">${totalIgst > 0 ? "-" : `${sgstRate}% (Amt: ₹${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`}</td>
        <td style="border: 1px solid #1f2937; padding: 6px; text-align: right; font-size: 11px;">₹${taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
          }
        )
        .join("")
      : "<tr><td colspan='6' style='border: 1px solid #1f2937; padding: 8px; text-align: center;'>No items found</td></tr>";

  const tableHeaders = `
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: left; font-size: 11px; font-weight: 600;">Item</th>
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: center; font-size: 11px; font-weight: 600;">Qty</th>
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: right; font-size: 11px; font-weight: 600;">Rate</th>
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: right; font-size: 11px; font-weight: 600;">CGST</th>
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: right; font-size: 11px; font-weight: 600;">SGST</th>
      <th style="border: 1px solid #1f2937; padding: 6px; background-color: #f3f4f6; text-align: right; font-size: 11px; font-weight: 600;">Amount</th>
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber || invoice.id}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            @page {
              margin: 1cm;
              size: A4;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .company-info {
            flex: 1;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111827;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-type {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 12px;
          }
          .details-section {
            margin: 24px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #1f2937;
            padding: 8px;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          .totals-table {
            max-width: 400px;
            margin-left: auto;
            margin-top: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .totals-total {
            border-top: 2px solid #1f2937;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 18px;
            font-weight: bold;
          }
          .amount-words {
            margin-top: 20px;
            padding: 12px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 30px;
          }
          .signature-box {
            border-bottom: 1px solid #9ca3af;
            height: 60px;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <div class="company-info" style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="flex-shrink: 0;">
                <img src="/42ev.png" alt="42 EV TECH & SERVICES" style="height: 64px; width: auto; object-fit: contain;" onerror="this.style.display='none';" />
              </div>
              <div style="flex: 1;">
                <div class="company-name" style="text-transform: uppercase;">${serviceCenter?.name || invoice.serviceCenterName || "FORTY TWO EV TECH AND SERVICES PVT LTD"}</div>
                <div style="font-size: 11px; color: #374151; margin-top: 4px; line-height: 1.3;">
                  ${serviceCenter?.address ? `<p style="margin: 2px 0;">${serviceCenter.address}</p>` : ""}
                  ${serviceCenter?.city || serviceCenter?.state || serviceCenter?.pincode
      ? `<p style="margin: 2px 0;">${serviceCenter.city ? `${serviceCenter.city}, ` : ""}${serviceCenter.state || ""}${serviceCenter.pincode ? ` ${serviceCenter.pincode}` : ""}</p>`
      : ""}
                  ${serviceCenter?.state ? `<p style="margin: 2px 0;">${serviceCenter.state} ${serviceCenter.pincode || ""}, India</p>` : ""}
                  ${serviceCenter?.gstNumber ? `<p style="margin: 2px 0;"><strong>GSTIN:</strong> ${serviceCenter.gstNumber}</p>` : ""}
                </div>
              </div>
            </div>
            <div class="invoice-details">
              <div class="invoice-type" style="font-size: 24px; color: #111827;">TAX INVOICE</div>
              <div style="font-size: 11px; text-align: right; line-height: 1.4;">
                <p style="margin: 2px 0;"><strong>Invoice No:</strong> ${invoice.invoiceNumber || invoice.id}</p>
                <p style="margin: 2px 0;"><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "/")}</p>
                <p style="margin: 2px 0;"><strong>Terms:</strong> Due on Receipt</p>
                <p style="margin: 2px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "/")}</p>
                ${invoice.placeOfSupply ? `<p style="margin: 2px 0;"><strong>Place Of Supply:</strong> ${invoice.placeOfSupply}</p>` : ""}
              </div>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0;">
            <div>
              <div class="section-title" style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Bill To:</div>
              <div style="font-size: 11px; color: #374151; line-height: 1.4;">
                <p style="font-weight: 600; margin-bottom: 4px;">${customer?.name || invoice.customerName}</p>
                ${customer?.gstNumber ? `<p style="margin: 2px 0;"><strong>Bill To GSTIN:</strong> ${customer.gstNumber}</p>` : ""}
                ${customer?.address ? `<p style="margin: 2px 0;">${customer.address}</p>` : ""}
                ${customer?.city || customer?.state || customer?.pincode
      ? `<p style="margin: 2px 0;">${customer.city ? `${customer.city}, ` : ""}${customer.state || ""}${customer.pincode ? ` ${customer.pincode}` : ""}</p>`
      : ""}
                ${customer?.phone ? `<p style="margin: 2px 0;">Phone: ${customer.phone}</p>` : ""}
              </div>
            </div>
            <div>
              <div class="section-title" style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Ship To:</div>
              <div style="font-size: 11px; color: #374151; line-height: 1.4;">
                <p style="font-weight: 600; margin-bottom: 4px;">${customer?.name || invoice.customerName}</p>
                ${customer?.gstNumber ? `<p style="margin: 2px 0;">(GSTIN ${customer.gstNumber})</p>` : ""}
                ${customer?.address ? `<p style="margin: 2px 0;">${customer.address}</p>` : ""}
                ${customer?.city || customer?.state || customer?.pincode
      ? `<p style="margin: 2px 0;">${customer.city ? `${customer.city}, ` : ""}${customer.state || ""}${customer.pincode ? ` ${customer.pincode}` : ""}</p>`
      : ""}
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${tableHeaders}
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals-table">
          <table style="font-size: 11px;">
            <tbody>
              <tr>
                <td style="text-align: right; font-weight: 600; padding: 6px; border: 1px solid #1f2937;">Sub Total:</td>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              ${totalCgst > 0
      ? `
              <tr>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">CGST9 (9%):</td>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">₹${totalCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              `
      : ""}
              ${totalSgst > 0
      ? `
              <tr>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">SGST9 (9%):</td>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">₹${totalSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              `
      : ""}
              ${roundOff !== 0
      ? `
              <tr>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">Rounding:</td>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">₹${roundOff.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              `
      : ""}
              <tr style="background-color: #f3f4f6;">
                <td style="text-align: right; font-weight: bold; padding: 6px; border: 1px solid #1f2937;">Total:</td>
                <td style="text-align: right; font-weight: bold; padding: 6px; border: 1px solid #1f2937;">₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              ${invoice.paidAmount && parseFloat(invoice.paidAmount.replace(/[₹,]/g, '')) > 0
      ? `
              <tr>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">Payment Made:</td>
                <td style="text-align: right; padding: 6px; border: 1px solid #1f2937;">(-) ₹${parseFloat(invoice.paidAmount.replace(/[₹,]/g, '')).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              `
      : ""}
              <tr>
                <td style="text-align: right; font-weight: 600; padding: 6px; border: 1px solid #1f2937;">Balance Due:</td>
                <td style="text-align: right; font-weight: 600; padding: 6px; border: 1px solid #1f2937;">₹${((invoice.balance && parseFloat(invoice.balance.replace(/[₹,]/g, ''))) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${invoice.amountInWords
      ? `
        <div style="margin: 16px 0;">
          <p style="font-size: 11px; color: #374151;"><strong>Total In Words:</strong> ${invoice.amountInWords}</p>
        </div>
        `
      : ""}
        <div style="margin: 16px 0;">
          <p style="font-size: 11px; color: #374151; font-style: italic;">Thanks for your business.</p>
        </div>

        ${invoice.termsAndConditions && Array.isArray(invoice.termsAndConditions) && invoice.termsAndConditions.length > 0
      ? `
        <div class="details-section">
          <div class="section-title">Terms & Conditions:</div>
          <ul style="font-size: 13px; color: #374151; padding-left: 20px;">
            ${invoice.termsAndConditions.map((term: string) => `<li style="margin-bottom: 4px;">${term}</li>`).join("")}
          </ul>
        </div>
        `
      : ""}

        ${invoice.bankDetails
      ? `
        <div class="details-section" style="margin: 20px 0;">
          <div style="font-size: 11px; color: #374151; line-height: 1.4;">
            <p style="margin: 2px 0;"><strong>Bank Name:</strong> ${invoice.bankDetails.bankName}</p>
            ${invoice.bankDetails.branch ? `<p style="margin: 2px 0;"><strong>Address:</strong> ${invoice.bankDetails.branch}</p>` : ""}
            <p style="margin: 2px 0;"><strong>Account Number:</strong> ${invoice.bankDetails.accountNumber}</p>
            <p style="margin: 2px 0;"><strong>IFSC Code:</strong> ${invoice.bankDetails.ifscCode}</p>
          </div>
        </div>
        `
      : ""}


        <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 24px; display: flex; flex-direction: column; align-items: flex-start;">
            <p style="font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 8px; margin-top: 0;">CEO & FOUNDER:</p>
            <img src="/signature.jpg" alt="Signature" style="display: block; height: 60px; width: 95px; margin-top: 8px; margin-bottom: 12px; object-fit: contain;" onerror="this.style.display='none';" />
            <p style="font-size: 11px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 0;">SAIRAJ AHIWALE</p>
            <div style="margin-top: 48px; border-bottom: 1px solid #9ca3af; width: 192px;"></div>
          </div>
        </div>
      </body>
    </html>
  `;
}



