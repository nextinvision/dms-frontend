/**
 * Quotation/Proforma Invoice PDF Document using React-PDF
 * Generates proper PDFs with text data instead of screenshots
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
} from "@react-pdf/renderer";
import type { Quotation } from "@/shared/types/quotation.types";

const RupeeIcon = ({ size = 9, color = "#111827" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Font-independent ₹ sign */}
    <Path
      d="M7 4h10v2H12.9c1.98.36 3.4 1.74 3.78 3.5H17v2h-4.18c-.54 1.8-2.1 3.1-4.22 3.34L17 20h-3.1l-6.9-5.6V12h3.2c1.47 0 2.62-.62 3.12-1.5H7v-2h6.4c-.5-.88-1.65-1.5-3.12-1.5H7V4z"
      fill={color}
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1f2937",
    paddingBottom: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827",
  },
  companyDetails: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  documentTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2563eb",
    textAlign: "right",
  },
  documentDetails: {
    fontSize: 9,
    color: "#374151",
    textAlign: "right",
    lineHeight: 1.5,
  },
  serviceAdvisorSection: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    flexDirection: "row",
    gap: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  // Used in Insurance section (keep simple 2-column wrap layout there)
  customerVehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 16,
  },
  customerVehicleItem: {
    width: "48%",
    marginBottom: 8,
  },
  customerVehicleGridTable: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#1f2937",
    borderRadius: 4,
  },
  customerVehicleGridRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1f2937",
  },
  customerVehicleGridRowLast: {
    borderBottomWidth: 0,
  },
  customerVehicleGridCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 2,
    borderRightColor: "#1f2937",
  },
  customerVehicleGridCellLast: {
    borderRightWidth: 0,
  },
  label: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "bold",
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: "#111827",
  },
  insuranceSection: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 16,
  },
  table: {
    width: "100%",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    minPresenceAhead: 20,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: "normal",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#9ca3af",
  },
  tableCellFirst: {
    borderLeftWidth: 0,
  },
  tableCellHeader: {
    fontWeight: "bold",
  },
  tableCellLast: {
    // No border on the last cell
  },
  tableCellSerial: {
    flex: 0.5,
    textAlign: "center",
    alignItems: "center",
  },
  tableCellPartName: {
    flex: 2,
    textAlign: "left",
    alignItems: "flex-start",
  },
  tableCellPartNumber: {
    flex: 1.5,
    textAlign: "left",
    alignItems: "flex-start",
  },
  tableCellQty: {
    flex: 0.8,
    textAlign: "center",
    alignItems: "center",
  },
  tableCellRate: {
    flex: 1.3,
    textAlign: "right",
    alignItems: "flex-end",
  },
  tableCellGST: {
    flex: 0.7,
    textAlign: "center",
    alignItems: "center",
  },
  tableCellAmount: {
    flex: 1.4,
    textAlign: "right",
    alignItems: "flex-end",
  },
  pricingTable: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#111827",
    marginTop: 12,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
  },
  pricingLabel: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    textAlign: "center",
    color: "#374151",
  },
  pricingValue: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    textAlign: "center",
    borderLeftWidth: 2,
    borderLeftColor: "#111827",
  },
  moneyRowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  moneyMinus: {
    fontSize: 9,
    color: "#111827",
  },
  pricingTotalRow: {
    borderTopWidth: 2,
    borderTopColor: "#1f2937",
    backgroundColor: "#f3f4f6",
  },
  pricingTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  pricingTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  notesSection: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111827",
  },
  notesText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#1f2937",
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
  approvalSection: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  approvalTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  approvalRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  approvalLabel: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "600",
  },
  approvalValue: {
    fontSize: 9,
    color: "#111827",
    marginLeft: 4,
  },
  approvalTimestamp: {
    fontSize: 8,
    color: "#6b7280",
    marginLeft: 4,
  },
  warrantyBadge: {
    fontSize: 7,
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "2px 4px",
    borderRadius: 2,
    marginLeft: 4,
  },
});

interface QuotationPDFDocumentProps {
  quotation: Quotation;
  serviceCenter?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
  };
  serviceAdvisor?: {
    name: string;
    phone: string;
  };
  signatureUrl?: string;
}

export const QuotationPDFDocument: React.FC<QuotationPDFDocumentProps> = ({
  quotation,
  serviceCenter,
  serviceAdvisor,
  signatureUrl,
}) => {
  // IMPORTANT: React-PDF runs in the browser here (pdf().toBlob()) and must fetch images with CORS rules.
  // Using same-origin assets (e.g. /public/42ev.png => /42ev.png) avoids CORS blocking.
  const logoSrc =
    (serviceCenter as any)?.logoUrl ||
    (serviceCenter as any)?.logo ||
    (quotation.serviceCenter as any)?.logoUrl ||
    (quotation.serviceCenter as any)?.logo ||
    "/42ev.png";

  const resolvedLogoSrc =
    typeof logoSrc === "string" && logoSrc.startsWith("/")
      ? `${typeof window !== "undefined" ? window.location.origin : ""}${logoSrc}`
      : logoSrc;
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const sc = serviceCenter || quotation.serviceCenter;
  const advisor = serviceAdvisor;

  const quotationDate = formatDate(quotation.quotationDate);
  const validUntilDate = quotation.validUntil ? formatDate(quotation.validUntil) : "N/A";

  const cgst = (quotation as any).cgst ?? (quotation as any).cgstAmount ?? 0;
  const sgst = (quotation as any).sgst ?? (quotation as any).sgstAmount ?? 0;
  const igst = (quotation as any).igst ?? (quotation as any).igstAmount ?? 0;
  const preGst = (quotation as any).preGstAmount && Number((quotation as any).preGstAmount) > 0
    ? (quotation as any).preGstAmount
    : (Number(quotation.subtotal || 0) - Number(quotation.discount || 0));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                src={resolvedLogoSrc}
                style={styles.logo}
              />
            </View>
            <View>
              <Text style={styles.companyName}>
                {sc?.name || "42 EV Tech & Services"}
              </Text>
              <View style={styles.companyDetails}>
                {sc?.address && <Text>{sc.address}</Text>}
                {(sc?.city || sc?.state || sc?.pincode) && (
                  <Text>
                    {sc.city}, {sc.state} - {sc.pincode}
                  </Text>
                )}
                {sc?.phone && <Text>Phone: {sc.phone}</Text>}
                {sc?.panNumber && <Text>PAN: {sc.panNumber}</Text>}
                {sc?.gstNumber && <Text>GST: {sc.gstNumber}</Text>}
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.documentTitle}>
              {quotation.documentType === "Proforma Invoice" ? "PROFORMA INVOICE" : "QUOTATION"}
            </Text>
            <View style={styles.documentDetails}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Document No:</Text> {quotation.quotationNumber}
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Date:</Text> {quotationDate}
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Valid Till:</Text> {validUntilDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Advisor Details */}
        {advisor && (
          <View style={styles.serviceAdvisorSection}>
            <Text style={styles.value}>
              <Text style={{ fontWeight: "bold" }}>Service Advisor:</Text> {advisor.name}
            </Text>
            <Text style={styles.value}>
              <Text style={{ fontWeight: "bold" }}>Phone:</Text> {advisor.phone}
            </Text>
          </View>
        )}

        {/* Customer & Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer & Vehicle Details</Text>
          {/* 4 columns x 2 rows grid:
              Col 1/3 = headings (labels), Col 2/4 = values */}
          <View style={styles.customerVehicleGridTable}>
            {/* Row 1 */}
            <View style={styles.customerVehicleGridRow}>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.label}>Customer Name</Text>
              </View>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.value}>
                  {quotation.customer?.name ||
                    `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim() ||
                    "N/A"}
                </Text>
              </View>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.label}>Vehicle Number</Text>
              </View>
              <View style={[styles.customerVehicleGridCell, styles.customerVehicleGridCellLast]}>
                <Text style={styles.value}>{quotation.vehicle?.registration || "N/A"}</Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={[styles.customerVehicleGridRow, styles.customerVehicleGridRowLast]}>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.label}>Phone Number</Text>
              </View>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.value}>{quotation.customer?.phone || "N/A"}</Text>
              </View>
              <View style={styles.customerVehicleGridCell}>
                <Text style={styles.label}>Brand and Model</Text>
              </View>
              <View style={[styles.customerVehicleGridCell, styles.customerVehicleGridCellLast]}>
                <Text style={styles.value}>
                  {(quotation.vehicle?.vehicleMake || quotation.vehicle?.make || "N/A") +
                    " " +
                    (quotation.vehicle?.vehicleModel || quotation.vehicle?.model || "")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Insurance Details */}
        {quotation.hasInsurance && (quotation.insurer || quotation.insuranceStartDate || quotation.insuranceEndDate) && (
          <View style={styles.insuranceSection}>
            <Text style={styles.sectionTitle}>Insurance Details</Text>
            <View style={styles.customerVehicleGrid}>
              {quotation.insurer && (
                <>
                  <View style={styles.customerVehicleItem}>
                    <Text style={styles.label}>Insurer Name</Text>
                    <Text style={styles.value}>{quotation.insurer.name}</Text>
                  </View>
                  {quotation.insurer.gstNumber && (
                    <View style={styles.customerVehicleItem}>
                      <Text style={styles.label}>Insurer GST Number</Text>
                      <Text style={styles.value}>{quotation.insurer.gstNumber}</Text>
                    </View>
                  )}
                  {quotation.insurer.address && (
                    <View style={[styles.customerVehicleItem, { width: "100%" }]}>
                      <Text style={styles.label}>Insurer Address</Text>
                      <Text style={styles.value}>{quotation.insurer.address}</Text>
                    </View>
                  )}
                </>
              )}
              {quotation.insuranceStartDate && (
                <View style={styles.customerVehicleItem}>
                  <Text style={styles.label}>Insurance Start Date</Text>
                  <Text style={styles.value}>{formatDate(quotation.insuranceStartDate)}</Text>
                </View>
              )}
              {quotation.insuranceEndDate && (
                <View style={styles.customerVehicleItem}>
                  <Text style={styles.label}>Insurance End Date</Text>
                  <Text style={styles.value}>{formatDate(quotation.insuranceEndDate)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Parts & Services Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parts & Services</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellSerial]}>
                <Text style={styles.tableCellHeader}>S.No</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellPartName]}>
                <Text style={styles.tableCellHeader}>Part Name</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellPartNumber]}>
                <Text style={styles.tableCellHeader}>Part Number</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellQty]}>
                <Text style={styles.tableCellHeader}>Qty</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRate]}>
                <Text style={styles.tableCellHeader}>Rate (Pre-GST)</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellGST]}>
                <Text style={styles.tableCellHeader}>GST %</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellAmount, styles.tableCellLast]}>
                <Text style={styles.tableCellHeader}>Amount (Incl. GST)</Text>
              </View>
            </View>

            {/* Items */}
            {quotation.items && quotation.items.length > 0 ? (
              quotation.items.map((item, index) => {
                const isLastRow = index === quotation.items.length - 1;
                return (
                  <View
                    key={item.id || index}
                    style={isLastRow ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}
                  >
                    <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellSerial]}>
                      <Text>{item.serialNumber || index + 1}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellPartName]}>
                      <Text>
                        {item.partName}
                        {item.partWarrantyTag && <Text style={styles.warrantyBadge}> Warranty</Text>}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellPartNumber]}>
                      <Text>{item.partNumber || "-"}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellQty]}>
                      <Text>{item.quantity}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellRate]}>
                      <View style={styles.moneyRowRight}>
                        <RupeeIcon size={7} />
                        <Text>{formatCurrency(Number(item.rate) || 0)}</Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellGST]}>
                      <Text>{item.gstPercent}%</Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellAmount, styles.tableCellLast]}>
                      <View style={styles.moneyRowRight}>
                        <RupeeIcon size={7} />
                        <Text>{formatCurrency(Number(item.amount) || (Number(item.rate) * item.quantity * (1 + (item.gstPercent || 18) / 100)))}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[styles.tableRow, styles.tableRowLast]}>
                <View style={[styles.tableCell, styles.tableCellLast, { flex: 7, textAlign: "center" }]}>
                  <Text>No items added</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Pricing Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.pricingTable}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal:</Text>
              <View style={styles.pricingValue}>
                <View style={styles.moneyRowRight}>
                  <RupeeIcon />
                  <Text>{formatCurrency(quotation.subtotal || 0)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Discount {Number(quotation.discountPercent || 0) > 0 ? `(${Number(quotation.discountPercent).toFixed(1)}%)` : "(0.0%)"}:
              </Text>
              <View style={styles.pricingValue}>
                <View style={styles.moneyRowRight}>
                  <RupeeIcon />
                  <Text>{formatCurrency(quotation.discount || 0)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Pre-GST Amount:</Text>
              <View style={styles.pricingValue}>
                <View style={styles.moneyRowRight}>
                  <RupeeIcon />
                  <Text>{formatCurrency(Number(preGst))}</Text>
                </View>
              </View>
            </View>
            {cgst > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>CGST (9%):</Text>
                <View style={styles.pricingValue}>
                  <View style={styles.moneyRowRight}>
                    <RupeeIcon />
                    <Text>{formatCurrency(Number(cgst))}</Text>
                  </View>
                </View>
              </View>
            )}
            {sgst > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>SGST (9%):</Text>
                <View style={styles.pricingValue}>
                  <View style={styles.moneyRowRight}>
                    <RupeeIcon />
                    <Text>{formatCurrency(Number(sgst))}</Text>
                  </View>
                </View>
              </View>
            )}
            {igst > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>IGST (18%):</Text>
                <View style={styles.pricingValue}>
                  <View style={styles.moneyRowRight}>
                    <RupeeIcon />
                    <Text>{formatCurrency(Number(igst))}</Text>
                  </View>
                </View>
              </View>
            )}
            <View style={[styles.pricingRow, styles.pricingTotalRow]}>
              <Text style={[styles.pricingLabel, styles.pricingTotalLabel]}>Total Amount:</Text>
              <View style={[styles.pricingValue, styles.pricingTotalValue]}>
                <View style={styles.moneyRowRight}>
                  <RupeeIcon color="#2563eb" />
                  <Text>{formatCurrency(quotation.totalAmount || 0)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {(quotation.notes || quotation.batterySerialNumber || quotation.customNotes) && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            {quotation.batterySerialNumber && (
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.notesText}>
                  <Text style={{ fontWeight: "bold" }}>Battery Serial Number:</Text> {quotation.batterySerialNumber}
                </Text>
              </View>
            )}
            {quotation.notes && (
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.notesText}>{quotation.notes}</Text>
              </View>
            )}
            {quotation.customNotes && (
              <View>
                <Text style={[styles.notesText, { fontWeight: "bold", marginBottom: 2 }]}>Additional Notes:</Text>
                <Text style={styles.notesText}>{quotation.customNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Approval Status */}
        {(quotation.sentToCustomer || quotation.customerApproved || quotation.customerRejected) && (
          <View style={styles.approvalSection}>
            <Text style={styles.approvalTitle}>Approval Status</Text>

            {/* Sent to Customer */}
            <View style={styles.approvalRow}>
              <Text style={styles.approvalLabel}>
                {quotation.sentToCustomer ? "✓" : "○"} Sent to Customer:
              </Text>
              <Text style={styles.approvalValue}>
                {quotation.sentToCustomer ? "Yes" : "No"}
              </Text>
              {quotation.sentToCustomerAt && (
                <Text style={styles.approvalTimestamp}>
                  ({new Date(quotation.sentToCustomerAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })})
                </Text>
              )}
            </View>

            {/* Customer Approval/Rejection Status */}
            <View style={styles.approvalRow}>
              <Text style={styles.approvalLabel}>
                {quotation.customerApproved ? "✓" : quotation.customerRejected ? "✗" : "○"} Customer:
              </Text>
              <Text style={styles.approvalValue}>
                {quotation.customerApproved ? "Approved" : quotation.customerRejected ? "Rejected" : "N/A"}
              </Text>
              {quotation.customerApprovedAt && (
                <Text style={styles.approvalTimestamp}>
                  ({new Date(quotation.customerApprovedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })})
                </Text>
              )}
              {quotation.customerRejectedAt && (
                <Text style={styles.approvalTimestamp}>
                  ({new Date(quotation.customerRejectedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })})
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {signatureUrl && (
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 4 }}>AUTHORIZED SIGNATORY:</Text>
              <Image src={signatureUrl} style={{ height: 40, objectFit: "contain" }} />
            </View>
          )}
          <Text>
            This is a {quotation.documentType.toLowerCase()}. Terms and conditions apply.
          </Text>
          {sc?.phone && (
            <Text style={{ marginTop: 4 }}>
              For queries, please contact: {sc.phone}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
