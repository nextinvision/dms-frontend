/**
 * Invoice PDF Document using React-PDF
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
import type { ServiceCenterInvoice, EnhancedServiceCenterInvoiceItem } from "@/shared/types/invoice.types";

// Font-independent Rupee symbol using SVG
const RupeeIcon = ({ size = 9, color = "#111827" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
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
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  logoContainer: {
    width: 50,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
    color: "#111827",
  },
  companyDetails: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  invoiceHeader: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  invoiceDetails: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "right",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111827",
  },
  customerInfo: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  customerName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  table: {
    width: "100%",
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
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
  tableCellItem: {
    flex: 3,
    textAlign: "left",
  },
  tableCellCenter: {
    flex: 1,
    textAlign: "center",
  },
  tableCellRight: {
    flex: 1.5,
    textAlign: "right",
  },
  totalsContainer: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsTable: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  totalsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  totalsLabel: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "right",
    fontWeight: "600",
  },
  totalsValue: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "right",
    borderLeftWidth: 1,
    borderLeftColor: "#1f2937",
  },
  totalsRowBold: {
    backgroundColor: "#f3f4f6",
  },
  amountInWords: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 9,
    color: "#374151",
  },
  notes: {
    marginTop: 12,
    fontSize: 9,
    fontStyle: "italic",
    color: "#374151",
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureSection: {
    marginTop: 24,
    marginBottom: 32,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#111827",
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 48,
    marginTop: 0,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    width: 192,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
  },
  poweredBy: {
    fontSize: 9,
    color: "#6b7280",
  },
  pageNumber: {
    fontSize: 9,
    color: "#9ca3af",
  },
  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

interface InvoicePDFDocumentProps {
  invoice: ServiceCenterInvoice;
  signatureUrl?: string; // New Prop
}

export const InvoicePDFDocument: React.FC<InvoicePDFDocumentProps> = React.memo(({ invoice, signatureUrl }) => {
  const serviceCenter = invoice.serviceCenterDetails;
  const customer = invoice.customerDetails;

  // Use enhanced items if available, otherwise fall back to legacy items
  const items: EnhancedServiceCenterInvoiceItem[] = invoice.enhancedItems || [];
  const hasEnhancedItems = items.length > 0;

  // Memoize expensive calculations
  const calculations = React.useMemo(() => {
    const subtotal = invoice.subtotal ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.taxableAmount, 0) : 0);
    const totalCgst = invoice.totalCgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.cgstAmount, 0) : 0);
    const totalSgst = invoice.totalSgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.sgstAmount, 0) : 0);
    const totalIgst = invoice.totalIgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.igstAmount, 0) : 0);
    const discount = invoice.discount ?? 0;
    const roundOff = invoice.roundOff ?? 0;
    const grandTotal = invoice.grandTotal ?? (subtotal + totalCgst + totalSgst + totalIgst - discount + roundOff);

    return { subtotal, totalCgst, totalSgst, totalIgst, discount, roundOff, grandTotal };
  }, [invoice, items, hasEnhancedItems]);

  const { subtotal, totalCgst, totalSgst, totalIgst, discount, roundOff, grandTotal } = calculations;

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                src="https://42evservice.cloud/42ev.png"
                style={styles.logo}
              />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {serviceCenter?.name || invoice.serviceCenterName || "FORTY TWO EV TECH AND SERVICES PVT LTD"}
              </Text>
              <View style={styles.companyDetails}>
                {serviceCenter?.address && <Text>{serviceCenter.address}</Text>}
                {(serviceCenter?.city || serviceCenter?.state || serviceCenter?.pincode) && (
                  <Text>
                    {serviceCenter.city && `${serviceCenter.city}, `}
                    {serviceCenter.state}
                    {serviceCenter.pincode && ` ${serviceCenter.pincode}`}
                  </Text>
                )}
                {serviceCenter?.gstNumber && (
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>GSTIN:</Text> {serviceCenter.gstNumber}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <View style={styles.invoiceDetails}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Invoice No:</Text> {invoice.invoiceNumber || invoice.id}
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Invoice Date:</Text> {formatDate(invoice.date)}
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Terms:</Text> Due on Receipt
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Due Date:</Text> {formatDate(invoice.dueDate)}
              </Text>
              {invoice.placeOfSupply && (
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Place Of Supply:</Text> {invoice.placeOfSupply}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill To / Ship To */}
        <View style={{ flexDirection: "row", marginBottom: 16, gap: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {customer?.name || invoice.customerName}
              </Text>
              {customer?.gstNumber && (
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Bill To GSTIN:</Text> {customer.gstNumber}
                </Text>
              )}
              {customer?.address && <Text>{customer.address}</Text>}
              {(customer?.city || customer?.state || customer?.pincode) && (
                <Text>
                  {customer.city && `${customer.city}, `}
                  {customer.state}
                  {customer.pincode && ` ${customer.pincode}`}
                </Text>
              )}
              {customer?.phone && <Text>Phone: {customer.phone}</Text>}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {customer?.name || invoice.customerName}
              </Text>
              {customer?.gstNumber && (
                <Text>(GSTIN {customer.gstNumber})</Text>
              )}
              {customer?.address && <Text>{customer.address}</Text>}
              {(customer?.city || customer?.state || customer?.pincode) && (
                <Text>
                  {customer.city && `${customer.city}, `}
                  {customer.state}
                  {customer.pincode && ` ${customer.pincode}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellItem]}>
              <Text style={styles.tableCellHeader}>Item</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellCenter]}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellRight]}>
              <Text style={styles.tableCellHeader}>Rate</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellRight]}>
              <Text style={styles.tableCellHeader}>CGST</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellRight]}>
              <Text style={styles.tableCellHeader}>SGST</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellRight]}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>

          {/* Items */}
          {hasEnhancedItems && items.length > 0 ? (
            items.map((item, index) => {
              const cgstRate = totalIgst > 0 || item.taxableAmount === 0 ? 0 : Math.round((item.cgstAmount / item.taxableAmount) * 100);
              const sgstRate = totalIgst > 0 || item.taxableAmount === 0 ? 0 : Math.round((item.sgstAmount / item.taxableAmount) * 100);
              const isLast = index === items.length - 1;

              return (
                <View key={index} style={isLast ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
                  <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellItem]}>
                    <Text>{item.name}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellCenter]}>
                    <Text>{item.quantity.toFixed(2)} pcs</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellRight]}>
                    <View style={styles.moneyRow}>
                      <RupeeIcon size={8} />
                      <Text>{formatCurrency(item.unitPrice)}</Text>
                    </View>
                  </View>
                  {totalIgst > 0 ? (
                    <View style={[styles.tableCell, styles.tableCellRight]}>
                      <Text>-</Text>
                    </View>
                  ) : (
                    <View style={[styles.tableCell, styles.tableCellRight]}>
                      <View style={styles.moneyRow}>
                        <Text>{cgstRate}% (</Text>
                        <RupeeIcon size={7} />
                        <Text>{formatCurrency(item.cgstAmount)})</Text>
                      </View>
                    </View>
                  )}
                  {totalIgst > 0 ? (
                    <View style={[styles.tableCell, styles.tableCellRight]}>
                      <Text>-</Text>
                    </View>
                  ) : (
                    <View style={[styles.tableCell, styles.tableCellRight]}>
                      <View style={styles.moneyRow}>
                        <Text>{sgstRate}% (</Text>
                        <RupeeIcon size={7} />
                        <Text>{formatCurrency(item.sgstAmount)})</Text>
                      </View>
                    </View>
                  )}
                  <View style={[styles.tableCell, styles.tableCellRight]}>
                    <View style={styles.moneyRow}>
                      <RupeeIcon size={8} />
                      <Text>{formatCurrency(item.taxableAmount)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => {
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
                const isLast = index === invoice.items.length - 1;

                return (
                  <View key={index} style={isLast ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
                    <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellItem]}>
                      <Text>{item.name || "-"}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellCenter]}>
                      <Text>{qty.toFixed(2)} pcs</Text>
                    </View>
                    {unitPrice > 0 ? (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <View style={styles.moneyRow}>
                          <RupeeIcon size={8} />
                          <Text>{formatCurrency(unitPrice)}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <Text>-</Text>
                      </View>
                    )}
                    {totalIgst > 0 ? (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <Text>-</Text>
                      </View>
                    ) : (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <View style={styles.moneyRow}>
                          <Text>{cgstRate}% (</Text>
                          <RupeeIcon size={7} />
                          <Text>{formatCurrency(cgstAmount)})</Text>
                        </View>
                      </View>
                    )}
                    {totalIgst > 0 ? (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <Text>-</Text>
                      </View>
                    ) : (
                      <View style={[styles.tableCell, styles.tableCellRight]}>
                        <View style={styles.moneyRow}>
                          <Text>{sgstRate}% (</Text>
                          <RupeeIcon size={7} />
                          <Text>{formatCurrency(sgstAmount)})</Text>
                        </View>
                      </View>
                    )}
                    <View style={[styles.tableCell, styles.tableCellRight]}>
                      <View style={styles.moneyRow}>
                        <RupeeIcon size={8} />
                        <Text>{formatCurrency(taxableAmount)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 7, textAlign: "center" }]}>
                  <Text>No items found</Text>
                </View>
              </View>
            )
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sub Total:</Text>
              <View style={styles.totalsValue}>
                <View style={styles.moneyRow}>
                  <RupeeIcon size={8} />
                  <Text>{formatCurrency(subtotal)}</Text>
                </View>
              </View>
            </View>
            {totalCgst > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>CGST9 (9%):</Text>
                <View style={styles.totalsValue}>
                  <View style={styles.moneyRow}>
                    <RupeeIcon size={8} />
                    <Text>{formatCurrency(totalCgst)}</Text>
                  </View>
                </View>
              </View>
            )}
            {totalSgst > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>SGST9 (9%):</Text>
                <View style={styles.totalsValue}>
                  <View style={styles.moneyRow}>
                    <RupeeIcon size={8} />
                    <Text>{formatCurrency(totalSgst)}</Text>
                  </View>
                </View>
              </View>
            )}
            {roundOff !== 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Rounding:</Text>
                <View style={styles.totalsValue}>
                  <View style={styles.moneyRow}>
                    <RupeeIcon size={8} />
                    <Text>{formatCurrency(roundOff)}</Text>
                  </View>
                </View>
              </View>
            )}
            <View style={[styles.totalsRow, styles.totalsRowBold]}>
              <Text style={styles.totalsLabel}>Total:</Text>
              <View style={styles.totalsValue}>
                <View style={styles.moneyRow}>
                  <RupeeIcon size={8} />
                  <Text>{formatCurrency(grandTotal)}</Text>
                </View>
              </View>
            </View>
            {invoice.paidAmount && parseFloat(invoice.paidAmount.replace(/[₹,]/g, '')) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Payment Made:</Text>
                <View style={styles.totalsValue}>
                  <View style={styles.moneyRow}>
                    <Text>(-) </Text>
                    <RupeeIcon size={8} />
                    <Text>{formatCurrency(parseFloat(invoice.paidAmount.replace(/[₹,]/g, '')))}</Text>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Balance Due:</Text>
              <View style={styles.totalsValue}>
                <View style={styles.moneyRow}>
                  <RupeeIcon size={8} />
                  <Text>{formatCurrency((invoice.balance && parseFloat(invoice.balance.replace(/[₹,]/g, ''))) || 0)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        {invoice.amountInWords && (
          <View style={styles.amountInWords}>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Total In Words:</Text> {invoice.amountInWords}
            </Text>
          </View>
        )}

        {/* Notes */}
        <Text style={styles.notes}>Thanks for your business.</Text>

        {/* Terms and Conditions */}
        {invoice.termsAndConditions && invoice.termsAndConditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
            {invoice.termsAndConditions.map((term, index) => (
              <Text key={index} style={{ fontSize: 9, marginLeft: 12, marginBottom: 2 }}>• {term}</Text>
            ))}
          </View>
        )}

        {/* Bank Details */}
        {invoice.bankDetails && (
          <View style={styles.section}>
            <View style={styles.customerInfo}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Bank Name:</Text> {invoice.bankDetails.bankName}
              </Text>
              {invoice.bankDetails.branch && (
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Address:</Text> {invoice.bankDetails.branch}
                </Text>
              )}
              <Text>
                <Text style={{ fontWeight: "bold" }}>Account Number:</Text> {invoice.bankDetails.accountNumber}
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>IFSC Code:</Text> {invoice.bankDetails.ifscCode}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>CEO & FOUNDER:</Text>
            <Image
              src="/signature.jpg"
              style={{
                height: 60,
                width: 75,
                marginTop: 8,
                marginBottom: 12,
                objectFit: "contain",
                alignSelf: "flex-start",
              }}
            />
            <Text style={styles.signatureName}>SAIRAJ AHIWALE</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.footerBottom}>
            {/* <View style={styles.poweredBy}>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>POWERED BY</Text>
              <Image
                src="https://42evservice.cloud/42ev.png"
                style={{ width: 32, height: 32, marginTop: 4, objectFit: "contain" }}
              />
            </View> */}
            <Text style={styles.pageNumber}>1</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
});
