/**
 * Check-in Slip PDF Document using React-PDF
 * Generates proper PDFs with text data instead of screenshots
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CheckInSlipData, EnhancedCheckInSlipData } from "@/shared/types/check-in-slip.types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1f2937",
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: "#6b7280",
    width: "40%",
    fontWeight: "600",
  },
  value: {
    fontSize: 9,
    color: "#111827",
    width: "60%",
  },
  fullRow: {
    marginBottom: 8,
  },
  notes: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
    marginTop: 4,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 24,
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    paddingBottom: 40,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
});

interface CheckInSlipPDFDocumentProps {
  data: CheckInSlipData | EnhancedCheckInSlipData;
}

export const CheckInSlipPDFDocument: React.FC<CheckInSlipPDFDocumentProps> = ({ data }) => {
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

  const formatTime = (timeStr: string) => {
    if (timeStr.includes(":")) {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const enhancedData = data as EnhancedCheckInSlipData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CHECK-IN SLIP</Text>
          <Text style={styles.subtitle}>{data.serviceCenterName}</Text>
          <Text style={styles.subtitle}>
            {data.serviceCenterAddress}, {data.serviceCenterCity}, {data.serviceCenterState} - {data.serviceCenterPincode}
          </Text>
          {data.serviceCenterPhone && (
            <Text style={styles.subtitle}>Phone: {data.serviceCenterPhone}</Text>
          )}
        </View>

        {/* Slip Number & Date */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Slip Number:</Text>
            <Text style={styles.value}>{data.slipNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-in Date:</Text>
            <Text style={styles.value}>{formatDate(data.checkInDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-in Time:</Text>
            <Text style={styles.value}>{formatTime(data.checkInTime)}</Text>
          </View>
          {enhancedData.dateOfVehicleDelivery && (
            <View style={styles.row}>
              <Text style={styles.label}>Date of Vehicle Delivery:</Text>
              <Text style={styles.value}>{formatDate(enhancedData.dateOfVehicleDelivery)}</Text>
            </View>
          )}
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.phone}</Text>
          </View>
          {data.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.email}</Text>
            </View>
          )}
          {enhancedData.customerType && (
            <View style={styles.row}>
              <Text style={styles.label}>Customer Type:</Text>
              <Text style={styles.value}>{enhancedData.customerType}</Text>
            </View>
          )}
          {enhancedData.customerFeedback && (
            <View style={styles.fullRow}>
              <Text style={styles.label}>Customer Feedback / Concerns:</Text>
              <Text style={styles.notes}>{enhancedData.customerFeedback}</Text>
            </View>
          )}
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Make:</Text>
            <Text style={styles.value}>{data.vehicleMake}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Model:</Text>
            <Text style={styles.value}>{data.vehicleModel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration Number:</Text>
            <Text style={styles.value}>{data.registrationNumber}</Text>
          </View>
          {data.vin && (
            <View style={styles.row}>
              <Text style={styles.label}>VIN:</Text>
              <Text style={styles.value}>{data.vin}</Text>
            </View>
          )}
          {enhancedData.batterySerialNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Battery Serial Number:</Text>
              <Text style={styles.value}>{enhancedData.batterySerialNumber}</Text>
            </View>
          )}
          {enhancedData.mcuSerialNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>MCU Serial Number:</Text>
              <Text style={styles.value}>{enhancedData.mcuSerialNumber}</Text>
            </View>
          )}
          {enhancedData.vcuSerialNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>VCU Serial Number:</Text>
              <Text style={styles.value}>{enhancedData.vcuSerialNumber}</Text>
            </View>
          )}
        </View>

        {/* Service Information */}
        {(data.serviceType || data.expectedServiceDate || enhancedData.serviceAdvisor || enhancedData.technicalObservation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Information</Text>
            {data.serviceType && (
              <View style={styles.row}>
                <Text style={styles.label}>Service Type:</Text>
                <Text style={styles.value}>{data.serviceType}</Text>
              </View>
            )}
            {data.expectedServiceDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Expected Service Date:</Text>
                <Text style={styles.value}>{formatDate(data.expectedServiceDate)}</Text>
              </View>
            )}
            {enhancedData.serviceAdvisor && (
              <View style={styles.row}>
                <Text style={styles.label}>Service Advisor:</Text>
                <Text style={styles.value}>{enhancedData.serviceAdvisor}</Text>
              </View>
            )}
            {enhancedData.technicalObservation && (
              <View style={styles.fullRow}>
                <Text style={styles.label}>Technical Observation:</Text>
                <Text style={styles.notes}>{enhancedData.technicalObservation}</Text>
              </View>
            )}
          </View>
        )}

        {/* Condition Checks */}
        {(enhancedData.chargerGiven !== undefined || enhancedData.mirrorCondition || enhancedData.otherPartsInVehicle) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition Checks</Text>
            {enhancedData.chargerGiven !== undefined && (
              <View style={styles.row}>
                <Text style={styles.label}>Charger Given:</Text>
                <Text style={styles.value}>{enhancedData.chargerGiven ? "Yes" : "No"}</Text>
              </View>
            )}
            {enhancedData.mirrorCondition && (
              <>
                {enhancedData.mirrorCondition.rh && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Mirror (RH):</Text>
                    <Text style={styles.value}>{enhancedData.mirrorCondition.rh}</Text>
                  </View>
                )}
                {enhancedData.mirrorCondition.lh && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Mirror (LH):</Text>
                    <Text style={styles.value}>{enhancedData.mirrorCondition.lh}</Text>
                  </View>
                )}
              </>
            )}
            {enhancedData.otherPartsInVehicle && (
              <View style={styles.fullRow}>
                <Text style={styles.label}>Other Parts in Vehicle:</Text>
                <Text style={styles.notes}>{enhancedData.otherPartsInVehicle}</Text>
              </View>
            )}
          </View>
        )}

        {/* Symptom / Defect Area */}
        {(enhancedData.symptom || enhancedData.defectArea) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problem Description</Text>
            {enhancedData.symptom && (
              <View style={styles.fullRow}>
                <Text style={styles.label}>Symptom:</Text>
                <Text style={styles.notes}>{enhancedData.symptom}</Text>
              </View>
            )}
            {enhancedData.defectArea && (
              <View style={styles.row}>
                <Text style={styles.label}>Defect Area:</Text>
                <Text style={styles.value}>{enhancedData.defectArea}</Text>
              </View>
            )}
          </View>
        )}

        {/* Warranty Tag */}
        {enhancedData.warrantyTag && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warranty Tag</Text>
            {enhancedData.warrantyTag.warrantyTag && (
              <View style={styles.row}>
                <Text style={styles.label}>Warranty Tag:</Text>
                <Text style={styles.value}>{enhancedData.warrantyTag.warrantyTag}</Text>
              </View>
            )}
            {enhancedData.warrantyTag.defectPartNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>Defect Part Number:</Text>
                <Text style={styles.value}>{enhancedData.warrantyTag.defectPartNumber}</Text>
              </View>
            )}
            {enhancedData.warrantyTag.defectDescription && (
              <View style={styles.fullRow}>
                <Text style={styles.label}>Defect Description:</Text>
                <Text style={styles.notes}>{enhancedData.warrantyTag.defectDescription}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notes}>{data.notes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Service Center Signature</Text>
          </View>
        </View>
        {enhancedData.signatures?.customerName && (
          <View style={styles.row}>
            <Text style={[styles.value, { marginTop: 4 }]}>
              Customer: {enhancedData.signatures.customerName}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>42 EV Tech & Services - Check-in Slip</Text>
          <Text style={{ marginTop: 4 }}>Generated on: {new Date().toLocaleString("en-IN")}</Text>
        </View>
      </Page>
    </Document>
  );
};
