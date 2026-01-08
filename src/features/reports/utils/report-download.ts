/**
 * Shared report download utilities
 */

import { apiClient } from "@/core/api/client";

interface ReportData {
  sales?: any;
  serviceVolume?: any;
  technicianPerformance?: any;
  inventory?: any;
}

/**
 * Download report as PDF
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
    const response = await apiClient.post(
      '/reports/generate-pdf',
      {
        reportType,
        reportData,
        serviceCenterName,
        dateRange,
      },
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${serviceCenterName}-${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    onSuccess?.();
  } catch (error: any) {
    console.error("Error downloading PDF:", error);
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

