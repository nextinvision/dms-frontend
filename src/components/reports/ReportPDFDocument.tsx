/**
 * Report PDF Document using React-PDF
 * Generates proper PDFs with text data for reports
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: "1 1 30%",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  cardLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  table: {
    width: "100%",
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    padding: 8,
    fontSize: 9,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#1f2937",
  },
  tableCellLeft: {
    flex: 2,
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
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface ReportPDFDocumentProps {
  reportType: string;
  reportData: {
    sales?: any;
    serviceVolume?: any;
    technicianPerformance?: any;
    inventory?: any;
  };
  serviceCenterName: string;
  dateRange: { from: string; to: string };
}

export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({
  reportType,
  reportData,
  serviceCenterName,
  dateRange,
}) => {
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "sales":
        return "Sales Report";
      case "service-volume":
        return "Service Volume Report";
      case "technician-performance":
        return "Technician Performance Report";
      case "inventory":
        return "Inventory Report";
      default:
        return "Report";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getReportTitle()}</Text>
          <Text style={styles.subtitle}>{serviceCenterName}</Text>
          <Text style={styles.subtitle}>
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </Text>
          <Text style={[styles.subtitle, { fontSize: 8, marginTop: 8 }]}>
            Generated on: {new Date().toLocaleString("en-IN")}
          </Text>
        </View>

        {/* Sales Report */}
        {reportType === "sales" && reportData.sales && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Revenue</Text>
                <Text style={styles.cardValue}>₹{formatCurrency(reportData.sales.totalRevenue || 0)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Invoices</Text>
                <Text style={styles.cardValue}>{reportData.sales.totalInvoices || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Avg Invoice Value</Text>
                <Text style={styles.cardValue}>₹{formatCurrency(reportData.sales.avgInvoiceValue || 0)}</Text>
              </View>
            </View>

            {reportData.sales.revenueByMonth && reportData.sales.revenueByMonth.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Revenue by Month</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellLeft]}>Month</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>Revenue</Text>
                  </View>
                  {reportData.sales.revenueByMonth.map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellLeft]}>{item.month}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight]}>
                        ₹{formatCurrency(item.revenue)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Service Volume Report */}
        {reportType === "service-volume" && reportData.serviceVolume && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Volume Summary</Text>
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Job Cards</Text>
                <Text style={styles.cardValue}>{reportData.serviceVolume.totalJobCards || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Completed</Text>
                <Text style={styles.cardValue}>{reportData.serviceVolume.completed || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>In Progress</Text>
                <Text style={styles.cardValue}>{reportData.serviceVolume.inProgress || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Pending</Text>
                <Text style={styles.cardValue}>{reportData.serviceVolume.pending || 0}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Average Completion Time</Text>
              <Text style={styles.cardValue}>{reportData.serviceVolume.avgCompletionTime || "N/A"}</Text>
            </View>
          </View>
        )}

        {/* Technician Performance Report */}
        {reportType === "technician-performance" && reportData.technicianPerformance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician Performance</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellLeft]}>Technician</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Completed Jobs</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Avg Rating</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Efficiency</Text>
              </View>
              {reportData.technicianPerformance.technicians?.map((tech: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellLeft]}>{tech.name}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{tech.completedJobs}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{tech.avgRating?.toFixed(1)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{tech.efficiency}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Inventory Report */}
        {reportType === "inventory" && reportData.inventory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Parts</Text>
                <Text style={styles.cardValue}>{reportData.inventory.totalParts || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Low Stock Items</Text>
                <Text style={styles.cardValue}>{reportData.inventory.lowStockCount || 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Inventory Value</Text>
                <Text style={styles.cardValue}>₹{formatCurrency(reportData.inventory.totalValue || 0)}</Text>
              </View>
            </View>

            {/* Top Moving Parts */}
            {reportData.inventory.topMovingParts && reportData.inventory.topMovingParts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Moving Parts</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellLeft]}>Part Name</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter]}>Stock Qty</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter]}>Usage Count</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>Unit Price</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>Total Value</Text>
                  </View>
                  {reportData.inventory.topMovingParts.slice(0, 10).map((part: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellLeft]}>{part.name}</Text>
                      <Text style={[styles.tableCell, styles.tableCellCenter]}>{part.quantity}</Text>
                      <Text style={[styles.tableCell, styles.tableCellCenter]}>{part.usageCount}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight]}>₹{formatCurrency(part.price)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight]}>₹{formatCurrency(part.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Low Moving Parts */}
            {reportData.inventory.lowMovingParts && reportData.inventory.lowMovingParts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Low Moving Parts</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellLeft]}>Part Name</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter]}>Stock Qty</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter]}>Usage Count</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>Unit Price</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>Total Value</Text>
                  </View>
                  {reportData.inventory.lowMovingParts.slice(0, 10).map((part: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellLeft]}>{part.name}</Text>
                      <Text style={[styles.tableCell, styles.tableCellCenter]}>{part.quantity}</Text>
                      <Text style={[styles.tableCell, styles.tableCellCenter]}>{part.usageCount}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight]}>₹{formatCurrency(part.price)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight]}>₹{formatCurrency(part.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>42 EV Tech & Services - Generated Report</Text>
        </View>
      </Page>
    </Document>
  );
};
