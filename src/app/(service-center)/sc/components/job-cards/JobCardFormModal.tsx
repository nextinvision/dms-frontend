"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { Loader2, X, Search, UserPlus, Car, FileText, CheckCircle, ArrowRight, Package, XCircle } from "lucide-react";

import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { createPartsRequestFromJobCard } from "@/shared/utils/jobCardPartsRequest.util";
import { customerService } from "@/features/customers/services/customer.service";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import CheckInSlip, { generateCheckInSlipNumber, type CheckInSlipData } from "@/components/check-in-slip/CheckInSlip";
import { getServiceCenterCode } from "@/shared/utils/service-center.utils";
import { JobCard } from "@/shared/types/job-card.types";
import { Quotation } from "@/shared/types/quotation.types";
import { CustomerWithVehicles, Vehicle } from "@/shared/types/vehicle.types";
import { quotationsService } from "@/features/quotations/services/quotations.service";
import { generateTempEntityId, updateFileEntityAssociation, RelatedEntityType } from "@/services/cloudinary/fileMetadata.service";

// New Hooks, Utils and Sections
import { useJobCardForm } from "@/features/job-cards/hooks/useJobCardForm";
import { jobCardAdapter } from "@/features/job-cards/utils/jobCardAdapter";
import { useHydratedJobCard } from "@/shared/hooks/useHydratedJobCard";
import { useRole } from "@/shared/hooks";
import { CustomerVehicleSection } from "./sections/CustomerVehicleSection";
import { Part2ItemsSection } from "./sections/Part2ItemsSection";
import { RequestedPartsSection } from "./sections/RequestedPartsSection";
import { CheckInSection } from "./sections/CheckInSection";
import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";
import { userRepository } from "@/core/repositories/user.repository";

interface JobCardFormModalProps {
  open: boolean;
  initialValues?: Partial<CreateJobCardForm>;
  jobCardId?: string;
  mode?: "create" | "edit";
  onClose: () => void;
  onCreated: (jobCard: JobCard) => void;
  onUpdated?: (jobCard: JobCard) => void;
  onError?: (message: string) => void;
  isFullPage?: boolean; // New prop to render as full page instead of modal
}

export default function JobCardFormModal({
  open,
  initialValues,
  jobCardId,
  mode = "create",
  onClose,
  onCreated,
  onUpdated,
  onError,
  isFullPage = false,
}: JobCardFormModalProps) {
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
  const serviceCenterId = String(serviceCenterContext.serviceCenterId ?? "sc-001");
  const serviceCenterCode = getServiceCenterCode(serviceCenterId);
  const router = useRouter();
  const { userRole, userInfo } = useRole();
  const isServiceAdvisor = userRole === "service_advisor";
  const isServiceManager = userRole === "sc_manager";
  const isTechnician = userRole === "service_engineer";

  // Generate a temporary ID for file uploads during creation
  const [tempId] = useState(() => generateTempEntityId());

  const {
    form,
    setForm,
    updateFormField,
    isSubmitting,
    setIsSubmitting,
    resetForm,
    handleSelectQuotation,
    handleSelectCustomer,
    selectedQuotation,
  } = useJobCardForm({

    initialValues,
    serviceCenterId,
    onError,
  });

  const [previewJobCardNumber, setPreviewJobCardNumber] = useState<string>("");
  const [existingJobCard, setExistingJobCard] = useState<JobCard | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCheckInSlip, setShowCheckInSlip] = useState(false);
  const [checkInSlipData, setCheckInSlipData] = useState<CheckInSlipData | null>(null);

  // Load existing job card if editing
  useEffect(() => {
    if (open && mode === "edit" && jobCardId) {
      const { migrateAllJobCards } = require("../../job-cards/utils/migrateJobCards.util");
      const jc = migrateAllJobCards().find((item: any) => item.id === jobCardId);
      if (jc) {
        setExistingJobCard(jc);
        setPreviewJobCardNumber(jc.jobCardNumber);
      }
    }
  }, [open, mode, jobCardId]);

  // Fetch job card from API for live state
  const { data: apiJobCard } = useQuery({
    queryKey: ["jobCard", jobCardId],
    queryFn: () => (jobCardId ? jobCardService.getById(jobCardId) : null),
    enabled: open && mode === "edit" && !!jobCardId,
    refetchOnWindowFocus: true,
  });

  // Use hydration hook for live data (merge local and API data)
  const combinedCard = useMemo(() => {
    if (!apiJobCard) return existingJobCard;
    if (!existingJobCard) return apiJobCard;
    return { ...existingJobCard, ...apiJobCard };
  }, [apiJobCard, existingJobCard]);

  const { jobCard: hydratedCard } = useHydratedJobCard(combinedCard);



  // Update form with hydrated data when it becomes available (only once or when ID changes)
  const [formInitialized, setFormInitialized] = useState(false);
  useEffect(() => {
    if (hydratedCard && mode === "edit" && !formInitialized) {
      const mappedFormData = jobCardAdapter.mapJobCardToForm(hydratedCard);
      setForm((prev: CreateJobCardForm) => ({
        ...prev,
        ...mappedFormData
      }));
      setFormInitialized(true);
    }
  }, [hydratedCard, mode, setForm, formInitialized]);

  // Reset initialization when ID changes
  useEffect(() => {
    setFormInitialized(false);
  }, [jobCardId]);


  // Unified Search Logic (Quotations + Customers)
  useEffect(() => {
    if (!searchQuery.trim() || !open) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearching(true);
        const query = searchQuery.toLowerCase();

        // 1. Search Approved Quotations
        const allQuotations = await quotationsService.getAll();
        const approvedQuotations = allQuotations.filter(
          (q: Quotation) => q.status === "CUSTOMER_APPROVED" || q.customerApproved === true
        );

        const quotationResults = approvedQuotations
          .filter((q: Quotation) => q.quotationNumber?.toLowerCase().includes(query))
          .map(async (q: Quotation) => {
            try {
              const customer = await customerService.getById(q.customerId);
              const vehicle = customer.vehicles?.find(v => v.id.toString() === q.vehicleId);
              return { type: 'quotation' as const, quotation: q, customer, vehicle };
            } catch {
              return null;
            }
          });

        // 2. Search Customers Directly (Express Mode)
        const customerSearchResults = await customerService.search(searchQuery, "auto");
        const directCustomerResults = customerSearchResults.map(c => ({
          type: 'customer' as const,
          customer: c,
          vehicle: c.vehicles?.[0]
        }));

        const resolvedQuotationResults = (await Promise.all(quotationResults)).filter(Boolean);

        const combined = [
          ...resolvedQuotationResults,
          ...directCustomerResults
        ];

        setSearchResults(combined);
        setShowSearchResults(combined.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();


    setIsSubmitting(true);
    try {
      const { migrateAllJobCards } = require("../../job-cards/utils/migrateJobCards.util");
      const existingJobCards = migrateAllJobCards();
      const jobCardForSave = apiJobCard || (mode === "edit" ? existingJobCards.find((jc: any) => jc.id === jobCardId) : null);

      const jobCardToSave = jobCardAdapter.mapFormToJobCard(
        form,
        serviceCenterId,
        serviceCenterCode,
        jobCardForSave
      );

      let savedJobCard;

      if (mode === "edit") {
        savedJobCard = await jobCardService.update(jobCardId!, jobCardToSave);
        onUpdated?.(savedJobCard);
      } else {
        savedJobCard = await jobCardService.create(jobCardToSave);

        // Link any uploaded files (using tempId) to the real Job Card ID
        if (tempId) {
          try {
            await updateFileEntityAssociation(tempId, savedJobCard.id, RelatedEntityType.JOB_CARD);
            console.log("✅ Linked temporary files to Job Card:", savedJobCard.id);
          } catch (fileError) {
            console.error("Failed to link files to job card:", fileError);
          }
        }

        onCreated(savedJobCard);
      }

      // Create Parts Request if parts selected
      if (form.selectedParts && form.selectedParts.length > 0) {
        const requestedBy = `${serviceCenterContext.serviceCenterName || "Service Center"} - Advisor`;
        await createPartsRequestFromJobCard(savedJobCard || jobCardToSave, requestedBy);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      onError?.("Failed to save job card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassToManager = async () => {
    if (!jobCardId || !hydratedCard) return;

    if (!confirm("Pass this job card to manager for approval?")) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Fetch manager for this service center
      const managers = await userRepository.getByRole("sc_manager", serviceCenterId);

      if (managers.length === 0) {
        // Try without service center filter if none found specifically
        const allManagers = await userRepository.getByRole("sc_manager");
        if (allManagers.length === 0) {
          throw new Error("No manager found to pass this job card to.");
        }
        await jobCardService.passToManager(jobCardId, allManagers[0].id);
      } else {
        await jobCardService.passToManager(jobCardId, managers[0].id);
      }

      alert("Job card passed to manager successfully!");
      onClose();
      router.push("/sc/job-cards");
    } catch (error: any) {
      console.error("Error passing to manager:", error);
      alert(error.message || "Failed to pass to manager. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCheckInSlip = () => {
    if (!form.customerId) {
      onError?.("Please select a customer first.");
      return;
    }

    const slipNumber = generateCheckInSlipNumber(serviceCenterCode);
    const now = new Date();

    setCheckInSlipData({
      slipNumber,
      customerName: form.fullName || form.customerName,
      phone: form.mobilePrimary,
      email: form.email,
      vehicleMake: form.vehicleMake,
      vehicleModel: form.vehicleModel,
      registrationNumber: form.vehicleRegistration,
      vin: form.vinChassisNumber,
      checkInDate: now.toISOString().split('T')[0],
      checkInTime: now.toTimeString().slice(0, 5),
      serviceCenterName: serviceCenterContext.serviceCenterName || "Service Center",
      serviceCenterAddress: "",
      serviceCenterCity: "",
      serviceCenterState: "",
      serviceCenterPincode: "",
      serviceType: form.description || "General Service",
      notes: form.description,
    });
    setShowCheckInSlip(true);
  };

  const handleCreateQuotation = async () => {
    if (!form.customerId || !form.vehicleId) {
      onError?.("Please select a customer and vehicle first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date();

      // Fetch all quotations to determine the next quotation number
      const allQuotations = await quotationsService.getAll();
      const prefix = `${serviceCenterCode}-QT-${now.getFullYear()}-`;
      const quotationsWithPrefix = allQuotations.filter((q: any) =>
        q.quotationNumber?.startsWith(prefix)
      );

      let seq = 1;
      if (quotationsWithPrefix.length > 0) {
        const lastQuotation = quotationsWithPrefix[quotationsWithPrefix.length - 1];
        const parts = lastQuotation.quotationNumber!.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }

      const quotationNumber = `${prefix}${seq.toString().padStart(4, '0')}`;

      // Fetch the actual job card from API to get the real serviceCenterId UUID
      let actualServiceCenterId = serviceCenterId; // fallback to prop

      if (jobCardId) {
        try {
          const jobCardFromApi = await jobCardService.getById(jobCardId);
          if (jobCardFromApi?.serviceCenterId) {
            actualServiceCenterId = jobCardFromApi.serviceCenterId;
            console.log("DEBUG: Fetched serviceCenterId from API:", actualServiceCenterId);
          }
        } catch (err) {
          console.warn("Could not fetch job card from API, using prop:", err);
        }
      }

      // Create quotation from job card data - matching backend CreateQuotationDto
      const quotationData = (() => {
        // Calculate totals
        const itemsWithCalculatedRates = (form.part2Items || []).map((item, index) => {
          const isWarranty = item.partWarrantyTag;
          const gstRate = (item.gstPercent || 18) / 100;
          const preGstRate = item.rate || (item.amount / (1 + gstRate)) || 0;
          const linePreGstTotal = preGstRate * (item.qty || 1);
          const lineAmountInclGst = linePreGstTotal * (1 + gstRate);

          return {
            serialNumber: index + 1,
            partName: item.partName || "Service Item",
            partNumber: item.partCode || undefined,
            quantity: item.qty || 1,
            rate: isWarranty ? 0 : preGstRate,
            gstPercent: item.gstPercent || 18,
            amount: isWarranty ? 0 : lineAmountInclGst,
            partWarrantyTag: isWarranty,
          };
        });

        const subtotal = itemsWithCalculatedRates.reduce((sum: number, item) => sum + (item.rate * item.quantity), 0);
        const preGstAmount = subtotal; // Assuming 0 discount initially when creating from job card
        const taxAmount = itemsWithCalculatedRates.reduce((sum: number, item) => sum + (item.amount - (item.rate * item.quantity)), 0);
        const totalAmount = subtotal + taxAmount;

        return {
          serviceCenterId: actualServiceCenterId,
          customerId: form.customerId,
          vehicleId: form.vehicleId!,
          quotationDate: now.toISOString().split('T')[0],
          documentType: "Quotation",
          hasInsurance: false,
          subtotal,
          discount: 0,
          discountPercent: 0,
          preGstAmount,
          cgst: taxAmount / 2,
          sgst: taxAmount / 2,
          igst: 0,
          totalAmount,
          jobCardId: jobCardId,
          items: itemsWithCalculatedRates,
          customNotes: form.description || undefined,
        };
      })();

      // Detailed validation logging
      console.log("=== QUOTATION CREATION DEBUG ===");
      console.log("serviceCenterId (from prop - code):", serviceCenterId);
      console.log("actualServiceCenterId (from API):", actualServiceCenterId);
      console.log("customerId:", form.customerId);
      console.log("vehicleId:", form.vehicleId);
      console.log("items count:", quotationData.items.length);
      console.log("Full quotationData:", JSON.stringify(quotationData, null, 2));
      console.log("=== END DEBUG ===");

      // Create the quotation
      try {
        const createdQuotation = await quotationsService.create(quotationData as any);
        console.log("Quotation created successfully:", createdQuotation);

        // Auto-approve quotation if Job Card is already approved
        if (hydratedCard?.managerReviewStatus === 'APPROVED') {
          try {
            await quotationsService.managerReview(createdQuotation.id, { status: 'APPROVED', notes: 'Auto-approved based on Job Card Approval' });
            console.log("Quotation auto-approved based on Job Card status.");
          } catch (autoApproveError) {
            console.error("Failed to auto-approve quotation:", autoApproveError);
          }
        } else if (hydratedCard?.status === "CREATED") {
          // If not manager approved (and thus not auto-approved), and currently CREATED,
          // move to AWAITING_QUOTATION_APPROVAL to act as "Draft" until customer approves.
          try {
            await jobCardService.updateStatus(jobCardId!, "AWAITING_QUOTATION_APPROVAL");
            console.log("Job Card status updated to AWAITING_QUOTATION_APPROVAL");
          } catch (statusError) {
            console.error("Failed to update job card status:", statusError);
          }
        }

        // Close modal and navigate to quotations page
        onClose();
        router.push(`/sc/quotations?highlight=${createdQuotation.id || quotationNumber}`);
      } catch (apiError: any) {
        console.error("Quotation creation failed:", apiError);
        console.error("Error response:", apiError.response?.data);
        const errorMessage = apiError.response?.data?.message || apiError.message || "Unknown error";
        throw new Error(`Quotation creation failed: ${errorMessage}`);
      }



    } catch (error) {
      console.error("Error creating quotation:", error);
      onError?.("Failed to create quotation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerDecision = async (status: "APPROVED" | "REJECTED", notes?: string) => {
    if (!jobCardId) return;

    if (status === "APPROVED" && !confirm("Approve this job card?")) return;

    let finalNotes = notes;
    if (status === "REJECTED" && !notes) {
      finalNotes = prompt("Please provide a reason for rejection:") || undefined;
      if (!finalNotes) return;
    }

    try {
      setIsSubmitting(true);
      await jobCardService.managerReview(jobCardId, { status, notes: finalNotes || "" });
      alert(status === "APPROVED" ? "Job Card Approved!" : "Job Card Rejected!");
      onClose();
    } catch (error) {
      console.error(error);
      onError?.("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  // Content wrapper - different styling for modal vs full page
  const contentClass = isFullPage
    ? "bg-white rounded-xl w-full flex flex-col shadow-lg"
    : "bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl search-container";

  const formContent = (
    <div className={contentClass}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={28} />
            {mode === "edit" ? "Edit Job Card" : "Create New Job Card"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "edit" ? "Modify existing job card details" : "Create a formal service record for the vehicle"}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="jobCardForm" onSubmit={handleSubmit} className="space-y-8">
          {/* Search Section (Only for Create Mode) */}
          {mode === "create" && (
            <div className="relative mb-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none text-lg shadow-sm"
                  placeholder="Search by Customer Name, Phone, VIN, or Quotation Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (result.type === 'quotation') {
                          handleSelectQuotation(result.quotation, result.customer, result.vehicle);
                        } else {
                          handleSelectCustomer(result.customer, result.vehicle);
                        }
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${result.type === 'quotation' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {result.type === 'quotation' ? <FileText size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {result.customer.name} {result.type === 'quotation' && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded ml-2">Quote Approved</span>}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                            <span>{result.customer.phone}</span>
                            {result.vehicle && (
                              <span className="flex items-center gap-1"><Car size={14} /> {result.vehicle.registration}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {result.type === 'quotation' && (
                        <div className="text-right">
                          <div className="text-xs font-mono text-gray-400 group-hover:text-blue-400">{result.quotation.quotationNumber}</div>
                          <div className="text-sm font-semibold text-blue-600">Apply Approved Quotation</div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          <CustomerVehicleSection
            form={form}
            updateField={updateFormField}
            previewJobCardNumber={previewJobCardNumber}
            mode={mode}
          />

          <Part2ItemsSection
            form={form}
            updateField={updateFormField}
            onError={onError}
            jobCardId={jobCardId || tempId}
            userId={userInfo?.id}
            onPassToManager={mode === "edit" && isServiceAdvisor ? handlePassToManager : undefined}
            isPassedToManager={hydratedCard?.passedToManager}
            isSubmitting={isSubmitting}
            hasQuotation={!!selectedQuotation || !!hydratedCard?.quotationId || !!hydratedCard?.quotation}
          />

          <RequestedPartsSection
            form={form}
            updateField={updateFormField}
            onError={onError}
          />

          {/* CheckInSection moved to Check-in Slip only - not shown in Job Card */}
          {/* <CheckInSection
            form={form}
            updateField={updateFormField}
          /> */}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-3">

          {!isTechnician && (
            <>
              <button
                type="button"
                onClick={handleCreateQuotation}
                disabled={isSubmitting || !!selectedQuotation || !!hydratedCard?.quotationId || !!hydratedCard?.quotation}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed ${!!selectedQuotation || !!hydratedCard?.quotationId || !!hydratedCard?.quotation

                  ? "bg-gray-100 text-gray-400 border border-gray-200"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:opacity-90"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    {!!selectedQuotation || !!hydratedCard?.quotationId || !!hydratedCard?.quotation ? "Quotation Created" : "Create Quotation"}
                  </>

                )}
              </button>

              {hydratedCard?.status === "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => router.push(`/sc/invoices?createFromJobCard=${jobCardId}`)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText size={20} />
                  Generate Invoice
                </button>
              )}
            </>
          )}

          {isTechnician && hydratedCard?.status === "ASSIGNED" && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Start work on this job card?")) return;
                try {
                  setIsSubmitting(true);
                  await jobCardService.update(jobCardId!, { status: "IN_PROGRESS" });
                  router.push("/sc/job-cards");
                } catch (e) {
                  console.error(e);
                  onError?.("Failed to start work");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              Start Work
            </button>
          )}

          {isTechnician && (
            <button
              type="button"
              onClick={async () => {
                if (!jobCardId || !form.requestedParts || form.requestedParts.length === 0) {
                  alert("No parts requested to save or Job ID missing.");
                  return;
                }
                try {
                  setIsSubmitting(true);

                  const items = form.requestedParts.map(item => ({
                    partName: item.partName,
                    quantity: item.qty,
                    isWarranty: item.partWarrantyTag,
                    partNumber: item.partCode,
                    inventoryPartId: undefined // Could be mapped if part selection provides ID
                  }));

                  await jobCardService.createPartsRequest(jobCardId, items);

                  alert("Parts request sent successfully!");
                  if (typeof window !== 'undefined') window.location.reload();
                } catch (e) {
                  console.error(e);
                  alert("Failed to send parts request");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !form.requestedParts || form.requestedParts.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Package size={20} />}
              Request Parts
            </button>
          )}

          {isTechnician && hydratedCard?.status === "IN_PROGRESS" && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Mark this job card as completed?")) return;
                try {
                  setIsSubmitting(true);
                  await jobCardService.update(jobCardId!, { status: "COMPLETED" });
                  router.push("/sc/job-cards");
                } catch (e) {
                  console.error(e);
                  onError?.("Failed to complete work");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              Complete Work
            </button>
          )}


          {isServiceManager && hydratedCard?.passedToManager && (
            (hydratedCard as any).managerReviewStatus === "PENDING"
          ) && (
              <>
                <button
                  type="button"
                  onClick={() => handleManagerDecision("APPROVED", "Approved via Form")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                >
                  <CheckCircle size={20} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleManagerDecision("REJECTED")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                >
                  <XCircle size={20} /> Reject
                </button>
              </>
            )}

        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          {!isTechnician && (
            <button
              type="submit"
              form="jobCardForm"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {mode === "edit" ? "Update Job Card" : "Create Job Card"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showCheckInSlip && checkInSlipData && (
        <CheckInSlip
          onClose={() => setShowCheckInSlip(false)}
          data={checkInSlipData}
        />
      )}
    </div>
  );

  // Return with or without modal wrapper based on isFullPage
  if (isFullPage) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {formContent}
    </div>
  );
}
