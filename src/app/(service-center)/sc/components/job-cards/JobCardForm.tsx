"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, UserPlus, Car, FileText, CheckCircle, ArrowLeft } from "lucide-react";
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
import { CustomerWithVehicles, Vehicle } from "@/shared/types/vehicle.types";

// Hooks, Utils and Sections
import { useJobCardForm } from "@/features/job-cards/hooks/useJobCardForm";
import { jobCardAdapter } from "@/features/job-cards/utils/jobCardAdapter";
import { useHydratedJobCard } from "@/shared/hooks/useHydratedJobCard";
import { useRole } from "@/shared/hooks";
import { CustomerVehicleSection } from "./sections/CustomerVehicleSection";
import { Part2ItemsSection } from "./sections/Part2ItemsSection";
import { CheckInSection } from "./sections/CheckInSection";
import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";

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
    const { userInfo } = useRole();
    const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
    const serviceCenterId = String(serviceCenterContext.serviceCenterId ?? "sc-001");
    const serviceCenterCode = getServiceCenterCode(serviceCenterId);

    const {
        form,
        setForm,
        updateFormField,
        isSubmitting,
        setIsSubmitting,
        resetForm,
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
            const { migrateAllJobCards } = require("../../job-cards/utils/migrateJobCards.util");
            const jc = migrateAllJobCards().find((item: any) => item.id === jobCardId);
            if (jc) {
                setExistingJobCard(jc);
                setPreviewJobCardNumber(jc.jobCardNumber);
            }
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
                    q => q.status === "customer_approved" || q.customerApproved === true
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
            const jobCardData: Omit<JobCard, "id"> = {
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
                description: form.customerFeedback || "",
                status: "Created",
                priority: "Normal",
                assignedEngineer: null,
                estimatedCost: "",
                estimatedTime: "",
                createdAt: mode === "edit" && existingJobCard ? existingJobCard.createdAt : new Date().toISOString(),
                parts: form.part2Items.map((item) => item.partName),
                location: "Station",
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
            };

            let savedJobCard: JobCard;
            if (mode === "edit" && jobCardId) {
                savedJobCard = await jobCardService.update(jobCardId, { ...jobCardData, id: jobCardId });
                alert("Job card updated successfully!");
            } else {
                savedJobCard = await jobCardService.create({ ...jobCardData, id: `temp_${Date.now()}` });
                const requestedBy = `${serviceCenterContext.serviceCenterName || "Service Center"} - Manager`;
                await createPartsRequestFromJobCard(savedJobCard, requestedBy);
                alert("Job card created successfully!");
            }

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
                        jobCardId={jobCardId || existingJobCard?.id}
                        userId={userInfo?.id}
                    />

                    <Part2ItemsSection
                        form={form}
                        updateField={updateFormField}
                        onError={(message) => alert(message)}
                        jobCardId={jobCardId || existingJobCard?.id}
                        userId={userInfo?.id}
                    />

                    <CheckInSection
                        form={form}
                        updateField={updateFormField}
                    />

                    {/* Footer Actions */}
                    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                        <div className="flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={handleGenerateCheckInSlip}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                            >
                                <FileText size={20} className="text-blue-600" />
                                Generate Check-in Slip
                            </button>

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
