"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, UserPlus, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import { DocumentsSection } from "./sections/DocumentsSection";

import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { createPartsRequestFromJobCard } from "@/shared/utils/jobCardPartsRequest.util";
import { customerService } from "@/features/customers/services/customer.service";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import CheckInSlip, { generateCheckInSlipNumber, type CheckInSlipData } from "@/components/check-in-slip/CheckInSlip";
import { getServiceCenterCode } from "@/shared/utils/service-center.utils";
import { JobCard } from "@/shared/types/job-card.types";
import { Quotation } from "@/shared/types/quotation.types";
import { quotationsService } from "@/features/quotations/services/quotations.service";
import { userRepository } from "@/core/repositories/user.repository";

// Hooks, Utils and Sections
import { useJobCardForm } from "@/features/job-cards/hooks/useJobCardForm";
import { jobCardAdapter } from "@/features/job-cards/utils/jobCardAdapter";
import { useHydratedJobCard } from "@/shared/hooks/useHydratedJobCard";
import { useRole } from "@/shared/hooks";
import { CustomerVehicleSection } from "./sections/CustomerVehicleSection";
import { Part2ItemsSection } from "./sections/Part2ItemsSection";
import { CheckInSection } from "./sections/CheckInSection";
import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";

import { generateTempEntityId, updateFileEntityAssociation, RelatedEntityType } from "@/services/cloudinary/fileMetadata.service";

interface JobCardFormProps {
    initialValues?: Partial<CreateJobCardForm>;
    jobCardId?: string;
    mode?: "create" | "edit";
}

export default function JobCardForm({
    initialValues,
    jobCardId,
    mode = "create",
}: JobCardFormProps) {
    const router = useRouter();
    const { userInfo, userRole } = useRole();
    const isServiceAdvisor = userRole === "service_advisor";
    const isServiceManager = userRole === "sc_manager";
    const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
    const serviceCenterId = String(serviceCenterContext.serviceCenterId ?? "sc-001");
    const serviceCenterCode = getServiceCenterCode(serviceCenterId);

    // Stable temp ID for new job cards
    const [tempEntityId] = useState(() => generateTempEntityId());
    // Active ID is either the real ID (edit mode) or the temp ID (create mode)
    const activeId = mode === "edit" ? jobCardId : tempEntityId;

    const {
        form,
        setForm,
        updateFormField,
        isSubmitting,
        setIsSubmitting,
        handleSelectQuotation,
        handleSelectCustomer,
    } = useJobCardForm({
        initialValues,
        serviceCenterId,
        onError: (message) => alert(message),
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
        if (mode === "edit" && jobCardId) {
            jobCardService.getById(jobCardId).then(jc => {
                if (jc) {
                    setExistingJobCard(jc);
                    setPreviewJobCardNumber(jc.jobCardNumber);
                }
            });
        }
    }, [mode, jobCardId]);

    // Use hydration hook for live data
    const { jobCard: hydratedCard } = useHydratedJobCard(existingJobCard);

    // Update form with hydrated data when it becomes available
    useEffect(() => {
        if (hydratedCard && mode === "edit") {
            const mappedFormData = jobCardAdapter.mapJobCardToForm(hydratedCard);
            setForm((prev: CreateJobCardForm) => ({
                ...prev,
                ...mappedFormData
            }));
        }
    }, [hydratedCard, mode, setForm]);

    // Generate preview job card number
    useEffect(() => {
        if (mode === "create") {
            const jobCards = safeStorage.getItem<JobCard[]>("jobCards", []);
            const latestSequence = jobCards
                .filter((jc) => jc.serviceCenterId === serviceCenterId)
                .length + 1;
            const newJobCardNumber = `${serviceCenterCode}-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(latestSequence).padStart(4, "0")}`;
            setPreviewJobCardNumber(newJobCardNumber);
        }
    }, [serviceCenterId, serviceCenterCode, mode]);

    // Search handler
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            setSearching(true);
            try {
                const query = searchQuery.toLowerCase();

                // 1. Search Customers
                const customersResponse = await customerService.search(searchQuery);
                const customers = Array.isArray(customersResponse) ? customersResponse : [];
                const customerResults = customers.map((c) => ({
                    type: "customer" as const,
                    customer: c,
                    vehicle: c.vehicles?.[0]
                }));

                // 2. Search Approved Quotations
                const allQuotations = safeStorage.getItem<Quotation[]>("quotations", []);
                const approvedQuotations = allQuotations.filter(
                    q => q.customerApproved === true
                );

                const quotationResults = approvedQuotations
                    .filter((q) => q.quotationNumber?.toLowerCase().includes(query))
                    .map(async (q) => {
                        try {
                            const customer = await customerService.getById(q.customerId);
                            const vehicle = customer.vehicles?.find(v => v.id.toString() === q.vehicleId);
                            return { type: "quotation" as const, quotation: q, customer, vehicle };
                        } catch {
                            return null;
                        }
                    });

                const resolvedQuotationResults = (await Promise.all(quotationResults)).filter(Boolean);

                const combined = [
                    ...resolvedQuotationResults,
                    ...customerResults
                ];

                setSearchResults(combined);
                setShowSearchResults(combined.length > 0);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.customerId || !form.vehicleId) {
            alert("Please select a customer and vehicle");
            return;
        }

        setIsSubmitting(true);

        try {
            const jobCardData: Omit<JobCard, "id"> & { part2A?: any } = {
                jobCardNumber: mode === "edit" && existingJobCard ? existingJobCard.jobCardNumber : previewJobCardNumber,
                serviceCenterId,
                serviceCenterCode,
                serviceCenterName: serviceCenterContext.serviceCenterName || "",
                customerId: form.customerId,
                customerName: form.customerName,
                vehicleId: form.vehicleId,
                vehicle: `${form.vehicleMake} ${form.vehicleModel}`,
                registration: form.vehicleRegistration,
                vehicleMake: form.vehicleMake,
                vehicleModel: form.vehicleModel,
                customerType: form.customerType as any,
                serviceType: "General Service",
                description: form.description || "",
                status: mode === "edit" && existingJobCard ? existingJobCard.status : "CREATED",
                priority: "NORMAL",
                assignedEngineer: null,
                estimatedCost: "",
                estimatedTime: "",
                createdAt: mode === "edit" && existingJobCard ? existingJobCard.createdAt : new Date().toISOString(),
                parts: form.part2Items.map((item) => item.partName),
                location: "STATION",
                isTemporary: true,
                part1: {
                    fullName: form.customerName,
                    mobilePrimary: form.mobilePrimary,
                    customerType: form.customerType,
                    vehicleBrand: form.vehicleMake,
                    vehicleModel: form.vehicleModel,
                    registrationNumber: form.vehicleRegistration,
                    vinChassisNumber: form.vinChassisNumber,
                    variantBatteryCapacity: form.variantBatteryCapacity || "",
                    warrantyStatus: form.warrantyStatus || "",
                    estimatedDeliveryDate: form.estimatedDeliveryDate || "",
                    customerAddress: form.customerAddress,
                    jobCardNumber: mode === "edit" && existingJobCard ? existingJobCard.jobCardNumber : previewJobCardNumber,
                    customerFeedback: form.customerFeedback,
                    technicianObservation: form.technicianObservation || "",
                    insuranceStartDate: form.insuranceStartDate || "",
                    insuranceEndDate: form.insuranceEndDate || "",
                    insuranceCompanyName: form.insuranceCompanyName || "",
                    batterySerialNumber: form.batterySerialNumber || "",
                    mcuSerialNumber: form.mcuSerialNumber || "",
                    vcuSerialNumber: form.vcuSerialNumber || "",
                    otherPartSerialNumber: form.otherPartSerialNumber || "",
                },
                part2: form.part2Items,
                part2A: {
                    issueDescription: form.issueDescription || "",
                    numberOfObservations: form.numberOfObservations || "",
                    symptom: form.symptom || "",
                    defectPart: form.defectPart || "",
                    videoEvidence: (form.videoEvidence.urls && form.videoEvidence.urls.length > 0) ? "Yes" : "No",
                    vinImage: (form.vinImage.urls && form.vinImage.urls.length > 0) ? "Yes" : "No",
                    odoImage: (form.odoImage.urls && form.odoImage.urls.length > 0) ? "Yes" : "No",
                    damageImages: (form.damageImages.urls && form.damageImages.urls.length > 0) ? "Yes" : "No",
                    // Include metadata for the DTO mapper
                    videoEvidenceMetadata: form.videoEvidence?.metadata || [],
                    vinImageMetadata: form.vinImage?.metadata || [],
                    odoImageMetadata: form.odoImage?.metadata || [],
                    damageImagesMetadata: form.damageImages?.metadata || [],
                }
            };

            let savedJobCard: JobCard;
            if (mode === "edit" && jobCardId) {
                savedJobCard = await jobCardService.update(jobCardId, { ...jobCardData, id: jobCardId });
                console.log("✅ Job card updated:", savedJobCard.id);
            } else {
                savedJobCard = await jobCardService.create({ ...jobCardData }, userInfo?.id);
                console.log("✅ Job card created:", savedJobCard.id);

                if (activeId && activeId.startsWith('TEMP_')) {
                    try {
                        console.log(`📎 Updating file associations: ${activeId} -> ${savedJobCard.id}`);
                        await updateFileEntityAssociation(activeId, savedJobCard.id, RelatedEntityType.JOB_CARD);
                        console.log("✅ File associations updated successfully");
                    } catch (error) {
                        console.error("⚠️ Failed to update file associations:", error);
                    }
                }

                const requestedBy = `${serviceCenterContext.serviceCenterName || "Service Center"} - Manager`;
                await createPartsRequestFromJobCard(savedJobCard, requestedBy);
            }

            alert(mode === "edit" ? "Job card updated successfully!" : "Job card created successfully!");
            router.push("/sc/job-cards");
        } catch (error) {
            console.error("Error saving job card:", error);
            alert("Failed to save job card");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateCheckInSlip = () => {
        const checkInData: CheckInSlipData = {
            slipNumber: generateCheckInSlipNumber(serviceCenterCode),
            checkInDate: new Date().toLocaleDateString("en-IN"),
            checkInTime: new Date().toLocaleTimeString("en-IN"),
            customerName: form.customerName,
            phone: form.mobilePrimary,
            vehicleMake: form.vehicleMake,
            vehicleModel: form.vehicleModel,
            registrationNumber: form.vehicleRegistration,
            serviceCenterName: serviceCenterContext.serviceCenterName || "",
            serviceCenterAddress: "",
            serviceCenterCity: "",
            serviceCenterState: "",
            serviceCenterPincode: "",
            notes: form.customerFeedback || "",
        };
        setCheckInSlipData(checkInData);
        setShowCheckInSlip(true);
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
            router.push("/sc/job-cards");
        } catch (error: any) {
            console.error("Error passing to manager:", error);
            alert(error.message || "Failed to pass to manager. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateQuotation = async () => {
        if (!form.customerId || !form.vehicleId) {
            alert("Please select a customer and vehicle first.");
            return;
        }

        try {
            setIsSubmitting(true);
            const now = new Date();

            // Fetch the actual job card from API to get the real serviceCenterId UUID
            let actualServiceCenterId = serviceCenterId;

            if (jobCardId) {
                try {
                    const jobCardFromApi = await jobCardService.getById(jobCardId);
                    if (jobCardFromApi?.serviceCenterId) {
                        actualServiceCenterId = jobCardFromApi.serviceCenterId;
                    }
                } catch (err) {
                    console.warn("Could not fetch job card from API, using prop:", err);
                }
            }

            const quotationData = {
                serviceCenterId: actualServiceCenterId,
                customerId: form.customerId,
                vehicleId: form.vehicleId,
                quotationDate: now.toISOString().split('T')[0],
                documentType: "Quotation",
                hasInsurance: false,
                discount: 0,
                jobCardId: jobCardId, // Correctly link to the job card
                items: form.part2Items?.map((item) => ({
                    partName: item.partName || "Service Item",
                    partNumber: item.partCode || undefined,
                    quantity: item.qty || 1,
                    rate: item.amount || 0,
                    gstPercent: 18,
                })) || [],
                customNotes: form.description || undefined,
            };

            const createdQuotation = await quotationsService.create(quotationData as any);
            console.log("Quotation created successfully:", createdQuotation);

            router.push(`/sc/quotations?highlight=${createdQuotation.id}`);
        } catch (error: any) {
            console.error("Error creating quotation:", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to create quotation: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#f9f9fb] min-h-screen py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className="text-3xl font-bold text-blue-600">
                        {mode === "edit" ? "Edit Job Card" : "Create New Job Card"}
                    </h1>
                    {mode === "create" && (
                        <p className="text-gray-600 mt-2">
                            Job Card Number: <span className="font-semibold text-gray-900">{previewJobCardNumber}</span>
                        </p>
                    )}
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Search Customer or Quotation</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by customer name, phone, or quotation number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-blue-600" size={20} />
                        )}
                    </div>

                    {/* Search Results */}
                    {showSearchResults && searchResults.length > 0 && (
                        <div className="mt-4 border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                            {searchResults.map((result, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        if (result.type === "customer") {
                                            handleSelectCustomer(result.customer, result.vehicle);
                                        } else {
                                            handleSelectQuotation(result.quotation, result.customer, result.vehicle);
                                        }
                                        setSearchQuery("");
                                        setShowSearchResults(false);
                                    }}
                                    className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition"
                                >
                                    {result.type === "customer" ? (
                                        <div className="flex items-center gap-3">
                                            <UserPlus size={20} className="text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">{result.customer.name}</p>
                                                <p className="text-sm text-gray-600">{result.customer.phone}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className="text-green-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">{result.quotation.quotationNumber}</p>
                                                <p className="text-sm text-gray-600">
                                                    {result.customer?.firstName} {result.customer?.lastName}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit}>
                    <CustomerVehicleSection
                        form={form}
                        updateField={updateFormField}
                        previewJobCardNumber={previewJobCardNumber}
                    />

                    <DocumentsSection
                        form={form}
                        updateField={updateFormField}
                        jobCardId={activeId}
                        userId={userInfo?.id}
                    />

                    <Part2ItemsSection
                        form={form}
                        updateField={updateFormField}
                        onError={(message) => alert(message)}
                        jobCardId={activeId}
                        userId={userInfo?.id}
                    />

                    <CheckInSection
                        form={form}
                        updateField={updateFormField}
                    />

                    {/* Footer Actions */}
                    <div className="bg-white rounded-xl shadow-md p-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleGenerateCheckInSlip}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                            >
                                <FileText size={20} className="text-blue-600" />
                                Generate Check-in Slip
                            </button>

                            <button
                                type="button"
                                onClick={handleCreateQuotation}
                                disabled={isSubmitting || !!hydratedCard?.quotationId || !!hydratedCard?.quotation}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${!!hydratedCard?.quotationId || !!hydratedCard?.quotation
                                    ? "bg-gray-100 text-gray-400 border border-gray-200"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
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
                                        {!!hydratedCard?.quotationId || !!hydratedCard?.quotation ? "Quotation Created" : "Create Quotation"}
                                    </>
                                )}
                            </button>

                            {mode === "edit" && isServiceAdvisor && (
                                <button
                                    type="button"
                                    onClick={handlePassToManager}
                                    disabled={isSubmitting || hydratedCard?.passedToManager}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${hydratedCard?.passedToManager
                                        ? "bg-gray-100 text-gray-400 border border-gray-200"
                                        : "bg-purple-600 text-white hover:bg-purple-700"
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowLeft size={20} className="transform rotate-180" />
                                            {hydratedCard?.passedToManager ? "Sent to Manager" : "Pass to Manager"}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        {mode === "edit" ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        {mode === "edit" ? "Update Job Card" : "Create Job Card"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Check-in Slip Modal */}
                {showCheckInSlip && checkInSlipData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                            <CheckInSlip data={checkInSlipData} onClose={() => setShowCheckInSlip(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
