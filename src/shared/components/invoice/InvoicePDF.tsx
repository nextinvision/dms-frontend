/**
 * Invoice PDF Component
 * Renders invoice in the exact format matching the provided PDF template
 */

import React from "react";
import { MessageCircle } from "lucide-react";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "./InvoicePDFDocument";
import type { ServiceCenterInvoice, EnhancedServiceCenterInvoiceItem } from "@/shared/types/invoice.types";

interface InvoicePDFProps {
  invoice: ServiceCenterInvoice;
  onClose?: () => void;
  showActions?: boolean;
  onSendToCustomer?: () => void;
  signatureUrl?: string; // Signature URL from parent component
}

export default React.memo(function InvoicePDF({ invoice, onClose, showActions = true, onSendToCustomer, signatureUrl: propSignatureUrl }: InvoicePDFProps) {
  const [signatureAbsoluteUrl, setSignatureAbsoluteUrl] = React.useState<string | undefined>(undefined);
  const [pdfGenerating, setPdfGenerating] = React.useState(false);
  const [viewerLoading, setViewerLoading] = React.useState(true);

  // Simplified signature handling - just use the prop directly
  React.useEffect(() => {
    console.log('[InvoicePDF] Using signature from props:', propSignatureUrl);
    if (propSignatureUrl) {
      setSignatureAbsoluteUrl(propSignatureUrl);
    }
  }, [propSignatureUrl]);

  // Auto-hide viewer loading after a delay to give PDFViewer time to render
  React.useEffect(() => {
    if (!pdfGenerating) {
      const timer = setTimeout(() => {
        setViewerLoading(false);
      }, 1500); // Hide loader after 1.5 seconds

      return () => clearTimeout(timer);
    } else {
      setViewerLoading(true);
    }
  }, [pdfGenerating]);


  // Memoize PDF generation to prevent unnecessary re-renders
  const pdfDocument = React.useMemo(
    () => <InvoicePDFDocument invoice={invoice} signatureUrl={signatureAbsoluteUrl} />,
    [invoice.id, signatureAbsoluteUrl]
  );

  // Add error state for PDF generation
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  // Generate PDF for preview with debouncing
  const generatePDFPreview = React.useCallback(async () => {
    try {
      setPdfGenerating(true);
      setPdfError(null);
      console.log('[InvoicePDF] Generating PDF preview with signature:', signatureAbsoluteUrl);
      console.log('[InvoicePDF] Invoice data:', {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        hasEnhancedItems: (invoice.enhancedItems?.length ?? 0) > 0,
        enhancedItemsCount: invoice.enhancedItems?.length ?? 0,
        hasLegacyItems: (invoice.items?.length ?? 0) > 0,
        legacyItemsCount: invoice.items?.length ?? 0
      });

      const blob = await pdf(pdfDocument as any).toBlob();
      console.log('[InvoicePDF] PDF blob generated, size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      // No need to store blob URL in state for PDFViewer, it takes the document directly
      console.log('[InvoicePDF] ✅ PDF preview generated successfully');
    } catch (error) {
      console.error('[InvoicePDF] ❌ Failed to generate PDF preview:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to generate PDF preview');
    } finally {
      setPdfGenerating(false);
    }
  }, [pdfDocument, signatureAbsoluteUrl, invoice.id, invoice.invoiceNumber, invoice.enhancedItems?.length, invoice.items?.length]);

  // Generate PDF when component mounts or signature changes
  React.useEffect(() => {
    // Slight delay to allow UI to render first
    const timer = setTimeout(() => {
      generatePDFPreview();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [generatePDFPreview]);

  const handlePrint = async () => {
    try {
      console.log('[InvoicePDF] handlePrint - signatureAbsoluteUrl:', signatureAbsoluteUrl);
      // Generate PDF blob using React-PDF for proper text-based PDF (use absolute URL, not blob URL)
      const blob = await pdf(pdfDocument as any).toBlob();

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
        // Fallback: if popup blocked, try download instead
        alert("Popup blocked. Please allow popups to print, or use Download PDF instead.");
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to generate PDF for printing:", error);
      // Fallback to old print method if PDF generation fails
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('[InvoicePDF] handleDownloadPDF - signatureAbsoluteUrl:', signatureAbsoluteUrl);
      // Generate PDF blob (use memoized document)
      const blob = await pdf(pdfDocument as any).toBlob();

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
      // Fallback to print dialog if PDF generation fails
      window.print();
    }
  };

  // Use enhanced items if available, otherwise fall back to legacy items
  const items: EnhancedServiceCenterInvoiceItem[] = invoice.enhancedItems || [];
  const hasEnhancedItems = items.length > 0;

  // Debug logging
  React.useEffect(() => {
    console.log('[InvoicePDF] Rendering invoice:', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      enhancedItemsCount: items.length,
      hasEnhancedItems,
      items: items,
      legacyItemsCount: invoice.items?.length || 0,
      legacyItems: invoice.items,
      fullInvoice: invoice
    });

    // Warn if no items found
    if (!hasEnhancedItems && (!invoice.items || invoice.items.length === 0)) {
      console.warn('[InvoicePDF] WARNING: No items found for invoice:', invoice.id);
    }
  }, [invoice.id, hasEnhancedItems, items.length]);

  // Calculate totals from enhanced items if available
  const subtotal = invoice.subtotal ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.taxableAmount, 0) : 0);
  const totalCgst = invoice.totalCgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.cgstAmount, 0) : 0);
  const totalSgst = invoice.totalSgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.sgstAmount, 0) : 0);
  const totalIgst = invoice.totalIgst ?? (hasEnhancedItems ? items.reduce((sum, item) => sum + item.igstAmount, 0) : 0);
  const totalTax = invoice.totalTax ?? (totalCgst + totalSgst + totalIgst);
  const discount = invoice.discount ?? 0;
  const roundOff = invoice.roundOff ?? 0;
  const grandTotal = invoice.grandTotal ?? (subtotal + totalTax - discount + roundOff);

  const serviceCenter = invoice.serviceCenterDetails;
  const customer = invoice.customerDetails;

  // Debug logging for service center
  React.useEffect(() => {
    console.log('[InvoicePDF] Service center data:', {
      hasServiceCenterDetails: !!invoice.serviceCenterDetails,
      serviceCenterDetails: invoice.serviceCenterDetails,
      serviceCenterName: invoice.serviceCenterName,
      serviceCenter: serviceCenter
    });
  }, [invoice.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header with Actions */}
        {showActions && (
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-[101] no-print">
            <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm inline-flex items-center gap-2"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm inline-flex items-center gap-2"
              >
                Download PDF
              </button>
              {onSendToCustomer && (
                <button
                  onClick={onSendToCustomer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm inline-flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  Send to Customer
                </button>
              )}
              {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <span className="text-2xl">×</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Invoice Content - Show PDF Preview using PDFViewer */}
        {pdfGenerating ? (
          <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[calc(95vh-80px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading invoice preview...</p>
          </div>
        ) : (
          <div className="w-full h-[calc(95vh-80px)] bg-gray-200 relative">
            {viewerLoading && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Rendering PDF preview...</p>
              </div>
            )}
            <PDFViewer width="100%" height="100%" className="border-0" showToolbar={true}>
              {pdfDocument}
            </PDFViewer>
          </div>
        )}
      </div>
    </div>
  );
});


