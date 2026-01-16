/**
 * Shared report download utilities
 */

import React from "react";
import { pdf } from "@react-pdf/renderer";
import { ReportPDFDocument } from "../../../components/reports/ReportPDFDocument";

interface ReportData {
  sales?: any;
  serviceVolume?: any;
  technicianPerformance?: any;
  inventory?: any;
}

/**
 * Download report as PDF using React-PDF
 */
export const downloadReportAsPdf = async (
  reportType: string,
  reportData: ReportData,
  serviceCenterName: string,
  dateRange: { from: string; to: string },
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    // Generate PDF blob using React-PDF
    const blob = await pdf(
      <ReportPDFDocument
        reportType={reportType}
        reportData={reportData}
        serviceCenterName={serviceCenterName}
        dateRange={dateRange}
      />
    ).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${serviceCenterName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
    onSuccess?.();
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    onError?.(error);
    throw error;
  }
};

/**
 * Download report as JSON
 */
export const downloadReportAsJson = (
  reportType: string,
  reportData: ReportData,
  serviceCenterName: string,
  onSuccess?: () => void
): void => {
  const dataStr = JSON.stringify(reportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}-report-${serviceCenterName}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  onSuccess?.();
};

