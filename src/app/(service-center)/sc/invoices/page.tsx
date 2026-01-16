"use client";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceRepository } from "@/core/repositories/invoice.repository";
import { invoicesService } from "@/features/invoices/services/invoices.service";
import { jobCardRepository } from "@/core/repositories/job-card.repository";
import { useRole } from "@/shared/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  PlusCircle,
  Printer,

  X,
  Plus,
  Trash2,
} from "lucide-react";
import type { ServiceCenterInvoice, PaymentStatus, InvoiceStats, ServiceCenterInvoiceItem, EnhancedServiceCenterInvoiceItem } from "@/shared/types";
import { filterByServiceCenter, getServiceCenterContext, shouldFilterByServiceCenter } from "@/shared/lib/serviceCenter";
import { generateInvoiceNumber, calculateGST, convertNumberToWords, populateInvoiceFromJobCard, validateInvoiceData } from "@/shared/utils/invoice.utils";
import { generateInvoiceHTML } from "@/shared/utils/invoicePDF.utils";
import type { JobCard } from "@/shared/types/job-card.types";
import InvoicePDF from "@/shared/components/invoice/InvoicePDF";

type FilterType = "all" | "paid" | "unpaid" | "overdue";

function InvoicesContent() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<ServiceCenterInvoice | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [selectedJobCardForInvoice, setSelectedJobCardForInvoice] = useState<string>("");
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: "",
    vehicle: "",
    jobCardId: "",
    customerId: "", // Store customer ID
    vehicleId: "",  // Store vehicle ID
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ name: "", qty: 1, price: "", gstRate: 18 }] as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
    paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
    gstRequirement: false,
    businessNameForInvoice: "",
    customerGstNumber: "",
    customerPanNumber: "",
    customerAddress: "",
    customerState: "",
    placeOfSupply: "",
    discount: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"Cash" | "Card" | "UPI" | "Online" | "Cheque">("Cash");
  const { userRole } = useRole();
  const isServiceAdvisor = userRole === "service_advisor";
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdFromParams = searchParams?.get("invoiceId");
  const [handledInvoiceId, setHandledInvoiceId] = useState<string | null>(null);
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
  const serviceCenterId = serviceCenterContext?.serviceCenterId;

  // Fetch invoices from backend - use invoicesService for proper data transformation
  const { data: fetchedInvoices = [] as ServiceCenterInvoice[], isLoading } = useQuery<ServiceCenterInvoice[]>({
    queryKey: ['invoices', serviceCenterId],
    queryFn: async () => {
      console.log('[InvoicesPage] Fetching invoices for service center:', serviceCenterId);
      const params = serviceCenterId ? { serviceCenterId: String(serviceCenterId) } : undefined;
      const invoices = await invoicesService.getAll(params);
      console.log('[InvoicesPage] Fetched invoices:', invoices.length, 'items');
      if (invoices.length > 0) {
        console.log('[InvoicesPage] Sample invoice:', {
          id: invoices[0].id,
          customerName: invoices[0].customerName,
          amount: invoices[0].amount,
          balance: invoices[0].balance,
          date: invoices[0].date,
          jobCardId: invoices[0].jobCardId,
          jobCardNumber: invoices[0].jobCardNumber,
          fullInvoice: invoices[0]
        });
      } else {
        console.warn('[InvoicesPage] No invoices found. Service Center ID:', serviceCenterId);
      }
      return invoices;
    },
    enabled: !!serviceCenterId, // Only fetch if service center ID is available
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Fetch completed job cards from backend
  const { data: completedJobCards = [] } = useQuery({
    queryKey: ['jobCards', 'completed'],
    queryFn: () => jobCardRepository.getByStatus('COMPLETED'),
  });

  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { systemSettingsService } = await import("@/services/systemSettings.service");
        const settings = await systemSettingsService.getAll();
        const sigSetting = settings.find(s => s.key === "invoices.signature_url");
        if (sigSetting?.value) {
          // Convert relative URL to absolute URL for PDF generation
          let absoluteUrl = sigSetting.value;
          if (absoluteUrl.startsWith('/uploads/')) {
            absoluteUrl = `https://42evservice.cloud${absoluteUrl}`;
          }
          console.log('[InvoicesPage] Signature URL:', absoluteUrl);
          console.log('[InvoicesPage] ✅ Signature URL fetched successfully:', absoluteUrl);
          setSignatureUrl(absoluteUrl);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const createInvoiceMutation = useMutation({
    mutationFn: async (createInvoiceDto: any) => {
      // Use invoicesService.create which properly handles the API call and response transformation
      return await invoicesService.create(createInvoiceDto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert(`Invoice generated and saved successfully! Invoice Number: ${data.invoiceNumber || data.id}`);
    },
    onError: (err: any) => {
      console.error("Failed to save invoice", err);

      // Extract error response data
      const errorData = err?.response?.data || err?.response || {};
      const errorDetails = err?.details || {};

      let errorMessage = err?.message || errorData?.message || errorDetails?.message || "Unknown error occurred";

      // Extract validation errors - handle different formats
      let validationErrors: string[] = [];

      if (Array.isArray(errorData?.errors)) {
        validationErrors = errorData.errors.map((err: any) =>
          typeof err === 'string' ? err : err.message || JSON.stringify(err)
        );
      } else if (errorDetails?.validationMessage) {
        validationErrors = [errorDetails.validationMessage];
      } else if (errorData?.message && Array.isArray(errorData.message)) {
        validationErrors = errorData.message;
      } else if (typeof errorData?.message === 'string' && errorData.message !== errorMessage) {
        validationErrors = [errorData.message];
      }

      // Build detailed error message
      let fullErrorMessage = `Invoice generated locally but failed to save to server.\n\nError: ${errorMessage}`;

      if (validationErrors.length > 0) {
        const errorList = validationErrors
          .map((msg: string, index: number) => `  ${index + 1}. ${msg}`)
          .join('\n');
        fullErrorMessage += `\n\nValidation Errors:\n${errorList}`;
      }

      fullErrorMessage += `\n\nIt may be lost on refresh. Please check the browser console for more details.`;

      // Log full error for debugging - including the full error object
      console.error("Invoice creation error details:", {
        message: errorMessage,
        status: err?.status || err?.response?.status || errorData?.statusCode,
        validationErrors: validationErrors,
        errorData: errorData,
        errorDetails: errorDetails,
        fullError: err,
        errorResponse: err?.response,
        errorResponseData: err?.response?.data
      });

      // Also log the actual error object structure
      console.error("Full error object structure:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

      alert(fullErrorMessage);
    }
  });

  // Use fetchedInvoices directly - no need to sync to separate state

  // Filter completed job cards that don't have invoices yet
  const availableJobCardsForInvoice = useMemo(() => {
    const invoicedJobCardIds = new Set(
      fetchedInvoices
        .filter(inv => inv.jobCardId)
        .map(inv => inv.jobCardId)
    );

    return completedJobCards.filter(
      jc => !invoicedJobCardIds.has(jc.id) && !invoicedJobCardIds.has(jc.jobCardNumber)
    );
  }, [completedJobCards, fetchedInvoices]);


  const createFromJobCardId = searchParams?.get("createFromJobCard");

  useEffect(() => {
    if (!invoiceIdFromParams || handledInvoiceId === invoiceIdFromParams) {
      return;
    }

    const invoice = fetchedInvoices.find((inv) => inv.id === invoiceIdFromParams);
    if (!invoice) {
      requestAnimationFrame(() => {
        setHandledInvoiceId(invoiceIdFromParams);
      });
      return;
    }

    requestAnimationFrame(() => {
      setSelectedInvoice(invoice);
      setShowDetails(true);
      setHandledInvoiceId(invoiceIdFromParams);
    });

  }, [invoiceIdFromParams, handledInvoiceId, fetchedInvoices, router]);

  // Handle createFromJobCard query param
  useEffect(() => {
    if (createFromJobCardId) {
      const fetchAndPopulate = async () => {
        try {
          const { jobCardService } = await import("@/features/job-cards/services/jobCard.service");
          const jobCard = await jobCardService.getById(createFromJobCardId);

          if (jobCard) {
            // Mock service center data for utility (since we don't have full object in context)
            const serviceCenterData: any = {
              id: serviceCenterContext.serviceCenterId || "sc-001",
              name: serviceCenterContext.serviceCenterName || "Service Center",
              state: "Maharashtra", // Default or fetch real one
              address: "",
              phone: ""
            };

            const populatedData = populateInvoiceFromJobCard(jobCard, serviceCenterData);

            // Map enhancedItems to form items to ensure correct unit price usage
            // Filter out warranty items (price 0) or handle them separately
            const formItems = populatedData.enhancedItems
              ?.filter(item => item.unitPrice > 0) // Only include items with price > 0
              .map(item => ({
                name: item.name,
                qty: item.quantity,
                price: item.unitPrice.toString(), // Use unit price, not total amount
                gstRate: item.gstRate
              })) || [{ name: "", qty: 1, price: "", gstRate: 18 }];

            // If no items after filtering, add an empty item
            if (formItems.length === 0) {
              formItems.push({ name: "", qty: 1, price: "", gstRate: 18 });
            }

            setInvoiceForm({
              customerName: populatedData.customerName || "",
              vehicle: populatedData.vehicle || "",
              jobCardId: jobCard.id || "", // Use actual job card UUID, not the job card number
              customerId: jobCard.customerId || "", // Store customer ID
              vehicleId: jobCard.vehicleId || "",   // Store vehicle ID
              date: new Date().toISOString().split("T")[0],
              dueDate: populatedData.dueDate || new Date().toISOString().split("T")[0],
              items: formItems,
              paymentMethod: "",
              gstRequirement: false,
              businessNameForInvoice: "",
              customerGstNumber: populatedData.customerDetails?.gstNumber || "",
              customerPanNumber: "",
              customerAddress: populatedData.customerDetails?.address || "",
              customerState: populatedData.customerDetails?.state || "",
              placeOfSupply: populatedData.placeOfSupply || "",
              discount: 0,
            });
            setShowGenerateModal(true);

            // Clean up URL
            router.replace("/sc/invoices");
          }
        } catch (error) {
          console.error("Error fetching job card for invoice:", error);
          alert("Failed to load Job Card details for invoice generation.");
        }
      };

      fetchAndPopulate();
    }
  }, [createFromJobCardId, serviceCenterContext, router]);

  // Since we're already filtering by serviceCenterId in the API call,
  // we don't need to filter again on the frontend
  // But we'll keep the filter for safety in case API doesn't filter correctly
  const visibleInvoices = useMemo(() => {
    // If serviceCenterId is provided to API, backend should already filter
    // So we can skip frontend filtering, but log for debugging
    console.log('[InvoicesPage] Invoice filtering:', {
      totalInvoices: fetchedInvoices.length,
      serviceCenterId: serviceCenterId,
      shouldFilter: shouldFilterByServiceCenter(serviceCenterContext),
      invoices: fetchedInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        serviceCenterId: inv.serviceCenterId,
        customerName: inv.customerName,
        amount: inv.amount,
        balance: inv.balance,
        date: inv.date
      }))
    });

    // Only filter if we didn't pass serviceCenterId to API (backwards compatibility)
    // For now, return fetchedInvoices directly since API should have filtered
    return fetchedInvoices;

    // If you want to double-check filtering, uncomment this:
    // const filtered = filterByServiceCenter(fetchedInvoices, serviceCenterContext);
    // return filtered;
  }, [fetchedInvoices, serviceCenterContext, serviceCenterId]);

  const filteredInvoices = useMemo(() => {
    const filtered = visibleInvoices.filter((invoice) => {
      const matchesSearch =
        (invoice.invoiceNumber || invoice.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof invoice.vehicle === 'string' ? invoice.vehicle : String(invoice.vehicle || '')).toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === "all") return matchesSearch;
      const statusLower = (invoice.status || '').toLowerCase();
      return matchesSearch && (statusLower === filter || (filter === "paid" && statusLower === "paid") || (filter === "unpaid" && statusLower === "unpaid") || (filter === "overdue" && statusLower === "overdue"));
    });

    console.log('[InvoicesPage] Final filtered invoices:', {
      visibleInvoicesCount: visibleInvoices.length,
      searchQuery: searchQuery,
      filter: filter,
      finalCount: filtered.length
    });

    return filtered;
  }, [visibleInvoices, searchQuery, filter]);

  const getStatusColor = (status: PaymentStatus): string => {
    const colors: Record<PaymentStatus, string> = {
      Paid: "bg-green-100 text-green-700 border-green-300",
      Unpaid: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Overdue: "bg-red-100 text-red-700 border-red-300",
      "Partially Paid": "bg-blue-100 text-blue-700 border-blue-300",
    };
    return colors[status] || colors.Unpaid;
  };

  const stats: InvoiceStats = {
    total: fetchedInvoices.length,
    paid: fetchedInvoices.filter((i) => i.status === "Paid").length,
    unpaid: fetchedInvoices.filter((i) => i.status === "Unpaid").length,
    overdue: fetchedInvoices.filter((i) => i.status === "Overdue").length,
    totalAmount: fetchedInvoices.reduce(
      (sum, inv) => {
        const amount = String(inv.amount || "0").replace("₹", "").replace(/,/g, "");
        return sum + (parseFloat(amount) || 0);
      },
      0
    ),
    paidAmount: fetchedInvoices.reduce(
      (sum, inv) => {
        const amount = String(inv.paidAmount || "0").replace("₹", "").replace(/,/g, "");
        return sum + (parseFloat(amount) || 0);
      },
      0
    ),
  };

  const handleRecordPayment = (invoiceId: string) => {
    setPaymentInvoiceId(invoiceId);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (paymentInvoiceId && selectedPaymentMethod) {
      try {
        await invoicesService.updateStatus(paymentInvoiceId, "PAID", selectedPaymentMethod);
        queryClient.invalidateQueries({ queryKey: ['invoices'] });

        // React Query will automatically refetch and update fetchedInvoices
        setShowPaymentModal(false);
        setPaymentInvoiceId(null);
      } catch (error) {
        console.error("Failed to record payment:", error);
        alert("Failed to record payment. Please try again.");
      }
    }
  };

  const formatInvoiceWhatsAppMessage = (invoice: ServiceCenterInvoice): string => {
    const customerName = invoice.customerName;
    const vehicleInfo = invoice.vehicle;
    const invoiceNumber = invoice.invoiceNumber || invoice.id;
    const invoiceDate = new Date(invoice.date).toLocaleDateString("en-IN");
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN");

    // Format items summary
    const itemsSummary = invoice.enhancedItems && invoice.enhancedItems.length > 0
      ? invoice.enhancedItems.slice(0, 5).map((item, idx) =>
        `${idx + 1}. ${item.name} (Qty: ${item.quantity}) - ₹${item.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      ).join("\n")
      : invoice.items.slice(0, 5).map((item, idx) =>
        `${idx + 1}. ${item.name} (Qty: ${item.qty}) - ${item.price}`
      ).join("\n");

    const remainingCount = invoice.enhancedItems
      ? Math.max(0, invoice.enhancedItems.length - 5)
      : Math.max(0, invoice.items.length - 5);

    const grandTotal = invoice.grandTotal ?? (parseFloat(invoice.amount.replace("₹", "").replace(/,/g, "")) || 0);
    const subtotal = invoice.subtotal ?? 0;
    const totalTax = invoice.totalTax ?? 0;

    const serviceCenter = invoice.serviceCenterDetails;

    return `Hello ${customerName}! 👋

📄 *Invoice ${invoiceNumber}*

📅 Invoice Date: ${invoiceDate}
⏰ Due Date: ${dueDate}
🚗 Vehicle: ${vehicleInfo}

📋 *Items Summary:*
${itemsSummary}
${remainingCount > 0 ? `... and ${remainingCount} more item${remainingCount > 1 ? "s" : ""}\n` : ""}

💰 *Pricing:*
Subtotal: ₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
${totalTax > 0 ? `Tax: ₹${totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}${invoice.discount && invoice.discount > 0 ? `Discount: -₹${invoice.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}*Grand Total: ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}*

📄 A detailed invoice PDF has been generated. Please review it.

💳 Please make payment before the due date.

📞 Contact: ${serviceCenter?.phone || "N/A"}
🏢 ${serviceCenter?.name || invoice.serviceCenterName || "Service Center"}`;
  };

  const handleSendInvoiceToCustomer = async (invoice: ServiceCenterInvoice) => {
    try {
      // Generate invoice HTML for PDF
      const invoiceHTML = generateInvoiceHTML(invoice, signatureUrl);

      // Generate PDF using React-PDF (for background PDF generation, doesn't block WhatsApp send)
      const generatePDF = async () => {
        try {
          const { pdf } = await import("@react-pdf/renderer");
          const { InvoicePDFDocument } = await import("@/shared/components/invoice/InvoicePDFDocument");
          const React = await import("react");

          // Generate PDF blob using React-PDF
          const blob = await pdf(
            React.createElement(InvoicePDFDocument, { invoice, signatureUrl }) as any
          ).toBlob();

          // Open PDF in new window/tab for printing
          const url = URL.createObjectURL(blob);
          const printWindow = window.open(url, '_blank');

          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
                setTimeout(() => {
                  URL.revokeObjectURL(url);
                }, 1000);
              }, 500);
            };
            return true;
          } else {
            alert("Popup blocked. Please allow popups to generate PDF. The invoice details will still be shown in the message.");
            URL.revokeObjectURL(url);
            return false;
          }
        } catch (error) {
          console.error("Error generating PDF:", error);
          // Fallback to HTML print
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 500);
            return true;
          }
          return false;
        }
      };

      // Generate PDF in background (doesn't block WhatsApp send)
      generatePDF();

      // Format WhatsApp message
      const message = formatInvoiceWhatsAppMessage(invoice);

      // Get customer phone number (would need to fetch from customer data)
      // For now, prompt user
      const customerPhone = prompt("Enter customer WhatsApp number (with country code, e.g., 919876543210):");
      if (!customerPhone) {
        return;
      }

      const cleanPhone = customerPhone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        alert("Invalid phone number. Please enter a valid WhatsApp number.");
        return;
      }

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      alert("Invoice sent to customer via WhatsApp!");
    } catch (error) {
      console.error("Error sending invoice:", error);
      alert("Failed to send invoice. Please try again.");
    }
  };

  const handleDownloadInvoice = async (invoice: ServiceCenterInvoice) => {
    try {
      // Generate PDF using React-PDF for direct download
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePDFDocument } = await import("@/shared/components/invoice/InvoicePDFDocument");
      const React = await import("react");

      // Generate PDF blob using React-PDF
      const blob = await pdf(
        React.createElement(InvoicePDFDocument, { invoice, signatureUrl }) as any
      ).toBlob();

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };



  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { name: "", qty: 1, price: "", gstRate: 18 }],
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm({
        ...invoiceForm,
        items: invoiceForm.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof ServiceCenterInvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  const handleGenerateInvoice = async () => {
    // Validate form
    if (!invoiceForm.customerName || !invoiceForm.vehicle || !invoiceForm.date || !invoiceForm.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validate items have name and price
    const emptyItems = invoiceForm.items.filter((item) => !item.name || !item.price);
    if (emptyItems.length > 0) {
      alert(`Please fill in all item details. Missing name or price for ${emptyItems.length} item(s).`);
      return;
    }

    // Check for items with invalid price values
    const invalidPriceItems = invoiceForm.items
      .map((item) => {
        const priceStr = String(item.price || "").trim();
        const cleanPrice = priceStr.replace(/₹/g, "").replace(/,/g, "").trim();
        const parsedPrice = parseFloat(cleanPrice);

        let issue = null;
        if (!priceStr || priceStr === "") {
          issue = "Price is empty";
        } else if (isNaN(parsedPrice)) {
          issue = `Invalid format: "${priceStr}"`;
        } else if (parsedPrice <= 0) {
          issue = `Must be greater than 0, got: ${parsedPrice}`;
        }

        return issue ? { item, issue, priceStr } : null;
      })
      .filter((result): result is { item: any; issue: string; priceStr: string } => Boolean(result));

    if (invalidPriceItems.length > 0) {
      // Log details for debugging
      console.error("Invalid price items detected:", invalidPriceItems);
      console.error("All invoice form items:", invoiceForm.items);

      const errorDetails = invalidPriceItems
        .map(({ item, issue, priceStr }) =>
          `• ${item.name || "Unnamed item"}: ${issue} (current value: "${priceStr}")`
        )
        .join("\n");

      alert(`Please enter valid prices for all items:\n\n${errorDetails}\n\nPlease enter a valid number (e.g., 2500, ₹2,500, or 2500.00)`);
      return;
    }

    // We need to get actual IDs for the backend
    // For now, we'll need to handle the case where we don't have them
    // The backend expects UUIDs for serviceCenterId, customerId, and vehicleId

    try {
      // Get service center ID - must be a valid UUID
      let contextServiceCenterId = serviceCenterContext.serviceCenterId;

      // Ensure it's a string
      if (contextServiceCenterId) {
        contextServiceCenterId = String(contextServiceCenterId);
      }

      // If we don't have a service center ID, try to get it from user info
      if (!contextServiceCenterId) {
        try {
          const { useAuthStore } = await import("@/store/authStore");
          const { userInfo } = useAuthStore.getState();
          contextServiceCenterId = userInfo?.serviceCenterId || userInfo?.serviceCenter || null;
          if (contextServiceCenterId) {
            contextServiceCenterId = String(contextServiceCenterId);
          }
        } catch (e) {
          console.warn("Failed to get service center from auth store:", e);
        }
      }

      // Validate service center ID exists
      if (!contextServiceCenterId) {
        alert("Unable to determine Service Center. Please ensure you're logged in correctly.");
        return;
      }

      // Check if we have the necessary UUIDs
      if (!invoiceForm.customerId || !invoiceForm.vehicleId) {
        alert("Missing customer or vehicle information. Please ensure you have selected a customer and vehicle.");
        return;
      }

      // Prepare items for backend (matching the DTO)
      const backendItems = invoiceForm.items
        .filter((item) => item.name && item.price) // Filter out empty items
        .map((item) => {
          // Validate item name first
          if (!item.name || item.name.trim() === "") {
            throw new Error("Item name is required for all items");
          }

          // Clean and parse price string
          const priceStr = String(item.price || "").trim();
          if (!priceStr || priceStr === "" || priceStr === "₹") {
            throw new Error(`Price is required for item: ${item.name}`);
          }

          // Remove currency symbols and commas, then parse
          const cleanPrice = priceStr
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .replace(/\s/g, "")
            .trim();

          const unitPrice = parseFloat(cleanPrice);

          // Validate parsed price
          if (isNaN(unitPrice)) {
            throw new Error(`Invalid price format for item: ${item.name}. Please enter a valid number.`);
          }
          if (unitPrice <= 0) {
            throw new Error(`Price must be greater than 0 for item: ${item.name}`);
          }

          // Parse quantity
          const quantity = Number(item.qty);
          if (isNaN(quantity) || quantity <= 0) {
            throw new Error(`Invalid quantity for item: ${item.name}. Please enter a valid number greater than 0.`);
          }

          // Parse GST rate
          const gstRate = Number(item.gstRate) || 18;
          if (isNaN(gstRate) || gstRate < 0) {
            throw new Error(`Invalid GST rate for item: ${item.name}. Using default 18%.`);
          }

          return {
            name: item.name.trim(),
            unitPrice: unitPrice,
            quantity: quantity,
            gstRate: gstRate,
          };
        });

      // Validate items array is not empty
      if (backendItems.length === 0) {
        alert("Please add at least one item to the invoice.");
        return;
      }

      // Validate IDs are valid UUIDs (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(String(contextServiceCenterId))) {
        console.error("Invalid serviceCenterId:", contextServiceCenterId);
        alert(`Invalid Service Center ID. Please ensure you're logged in correctly.`);
        return;
      }

      if (!uuidRegex.test(invoiceForm.customerId)) {
        console.error("Invalid customerId:", invoiceForm.customerId);
        alert(`Invalid Customer ID. Please select a customer.`);
        return;
      }

      if (!uuidRegex.test(invoiceForm.vehicleId)) {
        console.error("Invalid vehicleId:", invoiceForm.vehicleId);
        alert(`Invalid Vehicle ID. Please select a vehicle.`);
        return;
      }

      // Prepare DTO for backend
      const createInvoiceDto: any = {
        serviceCenterId: contextServiceCenterId,
        customerId: invoiceForm.customerId,
        vehicleId: invoiceForm.vehicleId,
        items: backendItems,
      };

      // Add optional fields only if they have values
      if (invoiceForm.jobCardId && invoiceForm.jobCardId.trim() !== "") {
        if (uuidRegex.test(invoiceForm.jobCardId)) {
          createInvoiceDto.jobCardId = invoiceForm.jobCardId;
          createInvoiceDto.invoiceType = 'JOB_CARD';
        } else {
          // jobCardId is not a UUID - might be a job card number
          // Don't send it to backend as jobCardId expects UUID
          // But we can still set invoiceType to JOB_CARD if it looks like a job card reference
          console.warn("jobCardId is not a UUID format, treating as OTC order:", invoiceForm.jobCardId);
          createInvoiceDto.invoiceType = 'OTC_ORDER';
        }
      } else {
        createInvoiceDto.invoiceType = 'OTC_ORDER';
      }

      if (invoiceForm.placeOfSupply || invoiceForm.customerState) {
        createInvoiceDto.placeOfSupply = invoiceForm.placeOfSupply || invoiceForm.customerState;
      }

      // Log the payload for debugging
      console.log("Creating invoice with payload:", JSON.stringify(createInvoiceDto, null, 2));
      console.log("Payload details:", {
        serviceCenterId: createInvoiceDto.serviceCenterId,
        customerId: createInvoiceDto.customerId,
        vehicleId: createInvoiceDto.vehicleId,
        jobCardId: createInvoiceDto.jobCardId,
        itemsCount: createInvoiceDto.items.length,
        items: createInvoiceDto.items
      });

      // Call mutation to save to backend
      createInvoiceMutation.mutate(createInvoiceDto);

      // Reset form and close modal
      setInvoiceForm({
        customerName: "",
        vehicle: "",
        jobCardId: "",
        customerId: "", // Store customer ID
        vehicleId: "",  // Store vehicle ID
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        items: [{ name: "", qty: 1, price: "", gstRate: 18 }],
        paymentMethod: "",
        gstRequirement: false,
        businessNameForInvoice: "",
        customerGstNumber: "",
        customerPanNumber: "",
        customerAddress: "",
        customerState: "",
        placeOfSupply: "",
        discount: 0,
      });
      setSelectedJobCardForInvoice("");
      setShowGenerateModal(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  // Handle job card selection from dropdown
  const handleJobCardSelection = (jobCardId: string) => {
    setSelectedJobCardForInvoice(jobCardId);

    if (!jobCardId) {
      // Reset form if no job card is selected
      setInvoiceForm({
        customerName: "",
        vehicle: "",
        jobCardId: "",
        customerId: "",
        vehicleId: "",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        items: [{ name: "", qty: 1, price: "", gstRate: 18 }] as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
        paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
        gstRequirement: false,
        businessNameForInvoice: "",
        customerGstNumber: "",
        customerPanNumber: "",
        customerAddress: "",
        customerState: "",
        placeOfSupply: "",
        discount: 0,
      });
      return;
    }

    // Find the selected job card
    const jobCard = availableJobCardsForInvoice.find(
      jc => jc.id === jobCardId || jc.jobCardNumber === jobCardId
    );

    if (jobCard) {
      const serviceCenter: any = {
        id: jobCard.serviceCenterId,
        code: jobCard.serviceCenterCode || "SC001",
        name: jobCard.serviceCenterName || serviceCenterContext.serviceCenterName || "Service Center",
        state: "Delhi", // Default, should come from service center config
      };

      const populatedData = populateInvoiceFromJobCard(jobCard, serviceCenter);

      if (populatedData) {
        // Map enhancedItems to form items, filter out warranty items (price 0)
        const formItems = populatedData.enhancedItems
          ?.filter(item => item.unitPrice > 0) // Only include items with price > 0
          .map(item => ({
            name: item.name,
            qty: item.quantity,
            price: item.unitPrice.toString(),
            gstRate: item.gstRate
          })) || [{ name: "", qty: 1, price: "", gstRate: 18 }];

        // If no items after filtering, add an empty item
        const finalFormItems = formItems.length > 0 ? formItems : [{ name: "", qty: 1, price: "", gstRate: 18 }];

        setInvoiceForm({
          customerName: populatedData.customerName || "",
          vehicle: populatedData.vehicle || "",
          jobCardId: jobCard.id || "", // Use actual job card UUID
          customerId: jobCard.customerId || "",
          vehicleId: jobCard.vehicleId || "",
          date: new Date().toISOString().split("T")[0],
          dueDate: populatedData.dueDate || new Date().toISOString().split("T")[0],
          items: finalFormItems as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
          paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
          gstRequirement: false,
          businessNameForInvoice: "",
          customerGstNumber: populatedData.customerDetails?.gstNumber || "",
          customerPanNumber: "",
          customerAddress: populatedData.customerDetails?.address || "",
          customerState: populatedData.customerDetails?.state || "",
          placeOfSupply: populatedData.placeOfSupply || "",
          discount: 0,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#f9f9fb] min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Invoices</h1>
            <p className="text-gray-500">Manage invoices and track payments</p>
          </div>
          <button
            onClick={() => {
              setShowGenerateModal(true);
              setSelectedJobCardForInvoice("");
              setInvoiceForm({
                customerName: "",
                vehicle: "",
                jobCardId: "",
                customerId: "",
                vehicleId: "",
                date: new Date().toISOString().split("T")[0],
                dueDate: "",
                items: [{ name: "", qty: 1, price: "", gstRate: 18 }] as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
                paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
                gstRequirement: false,
                businessNameForInvoice: "",
                customerGstNumber: "",
                customerPanNumber: "",
                customerAddress: "",
                customerState: "",
                placeOfSupply: "",
                discount: 0,
              });
            }}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Generate Invoice
          </button>
        </div>

        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <FileText size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{stats.total}</h2>
              <p className="text-sm text-gray-600">Total Invoices</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <CheckCircle size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{stats.paid}</h2>
              <p className="text-sm text-gray-600">Paid</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
                  <Clock size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{stats.unpaid}</h2>
              <p className="text-sm text-gray-600">Unpaid</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-red-100 text-red-600">
                  <XCircle size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{stats.overdue}</h2>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Total Invoice Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.paidAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{(stats.totalAmount - stats.paidAmount).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by invoice number, customer, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "paid", "unpaid", "overdue"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>

        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {invoice.invoiceNumber || invoice.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.jobCardNumber && (
                      <span className="text-xs text-gray-500">
                        Job Card: {invoice.jobCardNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-800">{invoice.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {typeof invoice.vehicle === 'string'
                          ? invoice.vehicle
                          : `${(invoice.vehicle as any).model || ''} ${(invoice.vehicle as any).registration || ''}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dates</p>
                      <p className="font-medium text-gray-800">
                        {invoice.date} (Due: {invoice.dueDate})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Amount: </span>
                      <span className="font-semibold text-gray-800">{invoice.amount}</span>
                    </div>
                    {invoice.status !== "Paid" && (
                      <div>
                        <span className="text-gray-600">Balance: </span>
                        <span className="font-semibold text-red-600">{invoice.balance}</span>
                      </div>
                    )}
                    {invoice.paymentMethod && (
                      <div>
                        <span className="text-gray-600">Payment: </span>
                        <span className="font-medium text-gray-800">{invoice.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          setLoadingInvoiceId(invoice.id);
                          console.log('[InvoicesPage] Fetching invoice details for ID:', invoice.id);
                          // Fetch complete invoice data by ID to ensure we have all items
                          const fullInvoice = await invoicesService.getById(invoice.id);
                          console.log('[InvoicesPage] Fetched invoice details:', {
                            id: fullInvoice.id,
                            enhancedItemsCount: fullInvoice.enhancedItems?.length || 0,
                            itemsCount: fullInvoice.items?.length || 0,
                            enhancedItems: fullInvoice.enhancedItems,
                            items: fullInvoice.items
                          });
                          setSelectedInvoice(fullInvoice);
                          setShowDetails(true);
                        } catch (error) {
                          console.error('[InvoicesPage] Failed to fetch invoice details:', error);
                          // Fallback to using invoice from list
                          setSelectedInvoice(invoice);
                          setShowDetails(true);
                        } finally {
                          setLoadingInvoiceId(null);
                        }
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition inline-flex items-center gap-2 disabled:opacity-50"
                      disabled={loadingInvoiceId === invoice.id}
                    >
                      <Eye size={16} />
                      {loadingInvoiceId === invoice.id ? 'Loading...' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition inline-flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>

                  </div>
                  {invoice.status !== "Paid" && (
                    <button
                      onClick={() => handleRecordPayment(invoice.id)}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInvoices.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Invoices Found</h3>
            <p className="text-gray-500">No invoices match the current filter criteria.</p>
          </div>
        )}

      </div>

      {/* Invoice Details Modal */}
      {showDetails && selectedInvoice && (
        <InvoicePDF
          invoice={selectedInvoice}
          onClose={() => setShowDetails(false)}
          showActions={true}
          onSendToCustomer={() => handleSendInvoiceToCustomer(selectedInvoice)}
          signatureUrl={signatureUrl}
        />
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-4xl mx-2 max-h-[90vh] overflow-y-auto p-4 md:p-6 z-[101]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Generate Invoice</h2>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedJobCardForInvoice("");
                  setInvoiceForm({
                    customerName: "",
                    vehicle: "",
                    jobCardId: "",
                    customerId: "",
                    vehicleId: "",
                    date: new Date().toISOString().split("T")[0],
                    dueDate: "",
                    items: [{ name: "", qty: 1, price: "", gstRate: 18 }] as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
                    paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
                    gstRequirement: false,
                    businessNameForInvoice: "",
                    customerGstNumber: "",
                    customerPanNumber: "",
                    customerAddress: "",
                    customerState: "",
                    placeOfSupply: "",
                    discount: 0,
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Job Card Selection */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border-2 border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <FileText className="text-indigo-600" size={20} />
                  Select Completed Job Card
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose a job card to auto-fill invoice details
                    </label>
                    <select
                      value={selectedJobCardForInvoice}
                      onChange={(e) => handleJobCardSelection(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white text-gray-800 font-medium"
                    >
                      <option value="">-- Select a completed job card or enter manually --</option>
                      {availableJobCardsForInvoice.map((jc) => (
                        <option key={jc.id} value={jc.id}>
                          {jc.jobCardNumber} - {jc.customerName} - {jc.vehicleMake} {jc.vehicleModel} ({jc.registration})
                        </option>
                      ))}
                    </select>
                    {availableJobCardsForInvoice.length === 0 && (
                      <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        ℹ No completed job cards available for invoicing. All completed job cards already have invoices or there are no completed job cards.
                      </p>
                    )}
                    {availableJobCardsForInvoice.length > 0 && (
                      <p className="mt-2 text-sm text-indigo-600">
                        💡 {availableJobCardsForInvoice.length} completed job card{availableJobCardsForInvoice.length !== 1 ? 's' : ''} available for invoicing
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceForm.customerName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceForm.vehicle}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, vehicle: e.target.value })}
                      placeholder="e.g., Honda City 2020"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Card ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={invoiceForm.jobCardId}
                      onChange={(e) => {
                        const jobCardId = e.target.value;
                        setInvoiceForm({ ...invoiceForm, jobCardId });
                        // Auto-populate from job card if exists
                        if (jobCardId) {
                          const jobCards = safeStorage.getItem<JobCard[]>("jobCards", []);
                          const jobCard = jobCards.find(jc => jc.id === jobCardId || jc.jobCardNumber === jobCardId);
                          if (jobCard) {
                            const serviceCenter: any = {
                              id: jobCard.serviceCenterId,
                              code: jobCard.serviceCenterCode || "SC001",
                              name: jobCard.serviceCenterName || serviceCenterContext.serviceCenterName || "Service Center",
                              state: "Delhi", // Default, should come from service center config
                            };
                            const populatedData = populateInvoiceFromJobCard(jobCard, serviceCenter);
                            if (populatedData) {
                              setInvoiceForm({
                                ...invoiceForm,
                                jobCardId,
                                customerName: populatedData.customerName || invoiceForm.customerName,
                                vehicle: populatedData.vehicle || invoiceForm.vehicle,
                                customerAddress: populatedData.customerDetails?.address || invoiceForm.customerAddress,
                                customerState: populatedData.customerDetails?.state || invoiceForm.customerState,
                                placeOfSupply: populatedData.placeOfSupply || invoiceForm.placeOfSupply,
                                items: populatedData.items || invoiceForm.items,
                              });
                            }
                          }
                        }
                      }}
                      placeholder="JC-2025-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer GST Details */}
              {invoiceForm.gstRequirement && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Customer GST Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer GST Number
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.customerGstNumber}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerGstNumber: e.target.value })}
                        placeholder="29ABCDE1234F1Z5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer PAN Number
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.customerPanNumber}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPanNumber: e.target.value })}
                        placeholder="ABCDE1234F"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Address
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.customerAddress}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                        placeholder="Enter customer address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer State
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.customerState}
                        onChange={(e) => {
                          const state = e.target.value;
                          setInvoiceForm({
                            ...invoiceForm,
                            customerState: state,
                            placeOfSupply: state || invoiceForm.placeOfSupply,
                          });
                        }}
                        placeholder="Enter state"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Place of Supply <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.placeOfSupply}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, placeOfSupply: e.target.value })}
                        placeholder="Enter place of supply (State)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Dates */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      min={invoiceForm.date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Billing & Payment Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <FileText className="text-indigo-600" size={20} />
                  Billing & Payment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={invoiceForm.paymentMethod}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Online">Online</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer h-full">
                      <input
                        type="checkbox"
                        checked={invoiceForm.gstRequirement}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, gstRequirement: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">GST Requirement</span>
                    </label>
                  </div>
                  {invoiceForm.gstRequirement && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name for Invoice
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.businessNameForInvoice}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, businessNameForInvoice: e.target.value })}
                        placeholder="Enter business name for invoice"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Invoice Items</h3>
                  <button
                    onClick={handleAddInvoiceItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateInvoiceItem(index, "name", e.target.value)}
                          placeholder="e.g., Engine Oil"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qty <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateInvoiceItem(index, "qty", parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.price || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdateInvoiceItem(index, "price", value);
                          }}
                          onBlur={(e) => {
                            // Validate and format price on blur
                            const value = e.target.value.trim();
                            if (value) {
                              const cleanPrice = value.replace(/₹/g, "").replace(/,/g, "").trim();
                              const parsedPrice = parseFloat(cleanPrice);
                              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                                // Format as currency (optional - you can remove this if you want to keep original input)
                                // e.target.value = `₹${parsedPrice.toLocaleString('en-IN')}`;
                              }
                            }
                          }}
                          placeholder="₹2,500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          required
                        />
                        {/* Show validation hint if price is invalid */}
                        {item.price && (() => {
                          const priceStr = String(item.price).trim();
                          const cleanPrice = priceStr.replace(/₹/g, "").replace(/,/g, "").trim();
                          const parsedPrice = parseFloat(cleanPrice);
                          if (isNaN(parsedPrice) || parsedPrice <= 0) {
                            return (
                              <p className="text-xs text-red-500 mt-1">
                                Enter a valid number (e.g., 2500)
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.gstRate || 18}
                          onChange={(e) => {
                            const updatedItems = [...invoiceForm.items];
                            updatedItems[index] = { ...updatedItems[index], gstRate: parseFloat(e.target.value) || 18 };
                            setInvoiceForm({ ...invoiceForm, items: updatedItems });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        {invoiceForm.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveInvoiceItem(index)}
                            className="w-full p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedJobCardForInvoice("");
                    setInvoiceForm({
                      customerName: "",
                      vehicle: "",
                      jobCardId: "",
                      customerId: "",
                      vehicleId: "",
                      date: new Date().toISOString().split("T")[0],
                      dueDate: "",
                      items: [{ name: "", qty: 1, price: "", gstRate: 18 }] as Array<ServiceCenterInvoiceItem & { gstRate?: number }>,
                      paymentMethod: "" as "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "",
                      gstRequirement: false,
                      businessNameForInvoice: "",
                      customerGstNumber: "",
                      customerPanNumber: "",
                      customerAddress: "",
                      customerState: "",
                      placeOfSupply: "",
                      discount: 0,
                    });
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-2 p-6 z-[101]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Record Payment</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {["Cash", "Card", "UPI", "Online", "Cheque"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method as any)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${selectedPaymentMethod === method
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentInvoiceId(null);
                }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Invoices() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}

