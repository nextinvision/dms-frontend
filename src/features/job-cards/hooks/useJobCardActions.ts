import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import type { JobCard, JobCardStatus, Engineer } from "@/shared/types";
import { staffService } from "@/features/workshop/services/staff.service";
import { jobCardPartsRequestService } from "@/features/inventory/services/jobCardPartsRequest.service";
import type { JobCardPart2Item } from "@/shared/types/job-card.types";
// Import utils
import { generateInvoiceNumber, populateInvoiceFromJobCard } from "@/shared/utils/invoice.utils";
import type { ServiceCenterInvoice } from "@/shared/types/invoice.types";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";

const SERVICE_CENTER_CODE_MAP_LOCAL: Record<string, string> = {
    "1": "SC001",
    "2": "SC002",
    "3": "SC003",
};

export function useJobCardActions(
    jobCards: JobCard[],
    setJobCards: React.Dispatch<React.SetStateAction<JobCard[]>>,
    userInfo: any
) {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useToastStore();

    // Engineers State
    const [engineers, setEngineers] = useState<Engineer[]>([]);

    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const data = await staffService.getEngineers();
                setEngineers(data);
            } catch (error) {
                console.error("Failed to fetch engineers:", error);
            }
        };
        fetchEngineers();
    }, []);

    // Modal & Selection States
    const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showAssignEngineerModal, setShowAssignEngineerModal] = useState<boolean>(false);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState<boolean>(false);
    const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
    const [showPartsRequestModal, setShowPartsRequestModal] = useState<boolean>(false);

    // Action States
    const [loading, setLoading] = useState<boolean>(false);
    const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
    const [updatingStatusJobId, setUpdatingStatusJobId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<JobCardStatus>("Assigned");
    const [selectedEngineer, setSelectedEngineer] = useState<string>("");

    // Technician Specific States
    const [selectedJobCardForRequest, setSelectedJobCardForRequest] = useState<string>("");
    const [partsRequestsData, setPartsRequestsData] = useState<Record<string, any>>({});
    const [workCompletion, setWorkCompletion] = useState<Record<string, boolean>>({});

    // --- Actions ---

    const handleJobCardCreated = (newJobCard: JobCard) => {
        const storedJobCards = safeStorage.getItem<JobCard[]>("jobCards", []);
        safeStorage.setItem("jobCards", [newJobCard, ...storedJobCards]);
        setJobCards((prev) => [newJobCard, ...prev]);
        setShowCreateModal(false);
    };

    const assignEngineer = async (jobId: string, engineerId: string) => {
        try {
            setLoading(true);
            // Mock API call simulation
            const engineer = engineers.find((e) => e.id.toString() === engineerId);
            setJobCards(
                jobCards.map((job) =>
                    job.id === jobId
                        ? { ...job, status: "Assigned" as JobCardStatus, assignedEngineer: engineer?.name || null }
                        : job
                )
            );
            setShowAssignEngineerModal(false);
            setAssigningJobId(null);
            setSelectedEngineer("");
        } catch (error) {
            console.error("Error assigning engineer:", error);
            alert("Failed to assign engineer. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (jobId: string, status: JobCardStatus) => {
        try {
            setLoading(true);
            // Mock API call simulation
            const updatedJobCards = jobCards.map((job) =>
                job.id === jobId
                    ? {
                        ...job,
                        status,
                        startTime: status === "In Progress" ? (typeof window !== "undefined" ? new Date().toLocaleString() : new Date().toISOString()) : job.startTime,
                        completedAt: status === "Completed" ? (typeof window !== "undefined" ? new Date().toLocaleString() : new Date().toISOString()) : job.completedAt,
                    }
                    : job
            );
            setJobCards(updatedJobCards);
            safeStorage.setItem("jobCards", updatedJobCards);

            // Update lead status logic (legacy)
            if ((status === "Completed" || status === "Invoiced") && jobId) {
                const existingLeads = safeStorage.getItem<any[]>("leads", []);
                const leadIndex = existingLeads.findIndex((l) => l.jobCardId === jobId);

                if (leadIndex !== -1) {
                    const lead = existingLeads[leadIndex];
                    const completionNote = status === "Invoiced"
                        ? `Service completed and invoiced on ${new Date().toLocaleString()}`
                        : `Service completed on ${new Date().toLocaleString()}`;
                    const updatedNotes = lead.notes
                        ? `${lead.notes}\n${completionNote}`
                        : completionNote;

                    existingLeads[leadIndex] = {
                        ...lead,
                        status: "converted" as const,
                        notes: updatedNotes,
                        updatedAt: new Date().toISOString(),
                    };
                    safeStorage.setItem("leads", existingLeads);
                }
            }

            setShowStatusUpdateModal(false);
            setUpdatingStatusJobId(null);
        } catch (error) {
            console.error("Error updating status:", error);
            showError("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignEngineer = () => {
        if (!assigningJobId || !selectedEngineer) {
            showWarning("Please select an engineer.");
            return;
        }
        assignEngineer(assigningJobId, selectedEngineer);
    };

    const handleStatusUpdate = () => {
        if (!updatingStatusJobId || !newStatus) {
            return;
        }
        updateStatus(updatingStatusJobId, newStatus);
    };

    const handleManagerQuoteAction = () => {
        if (!selectedJob) {
            showWarning("Please select a job card before creating the manager quote.");
            return;
        }
        const params = new URLSearchParams({
            action: "create",
            jobCardId: selectedJob.id,
        });
        router.push(`/sc/quotations?${params.toString()}`);
    };

    const handlePartRequestSubmit = async (assignedJobCards: JobCard[], jobId?: string, items?: JobCardPart2Item[]) => {
        const jobCardId = jobId || selectedJobCardForRequest;
        if (!jobCardId) {
            showWarning("Select a job card before submitting a part request.");
            return;
        }

        const selectedJobCard = assignedJobCards.find((job: JobCard) => job.id === jobCardId || job.jobCardNumber === jobCardId);
        if (!selectedJobCard) {
            showError("Selected job card not found.");
            return;
        }

        if (!items || items.length === 0) {
            showWarning("Please add at least one item to the list before submitting.");
            return;
        }

        const partsWithDetails = items.map((item) => ({
            partId: item.partCode || `unknown-${item.partName.replace(/\s+/g, "-").toLowerCase()}`,
            partName: item.partName,
            quantity: item.qty,
            serialNumber: item.isWarranty && item.serialNumber ? item.serialNumber : undefined,
            isWarranty: item.isWarranty || false,
        }));

        try {
            setLoading(true);

            const requestedBy = userInfo?.name || "Service Engineer";

            const request = await jobCardPartsRequestService.createRequestFromJobCard(
                selectedJobCard,
                partsWithDetails,
                requestedBy
            );

            setPartsRequestsData((prev) => {
                const updated = { ...prev };
                updated[jobCardId] = request;
                if (selectedJobCard.id) updated[selectedJobCard.id] = request;
                if (selectedJobCard.jobCardNumber) updated[selectedJobCard.jobCardNumber] = request;
                if (request.jobCardId) updated[request.jobCardId] = request;
                return updated;
            });

            showSuccess(`Part request submitted for Job Card: ${selectedJobCard.jobCardNumber || selectedJobCard.id}\nItems: ${partsWithDetails.length}`);
        } catch (error) {
            console.error("Failed to submit parts request:", error);
            showError("Failed to submit parts request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleServiceManagerPartApproval = async (isTechnician: boolean) => {
        const jobCardId = isTechnician ? selectedJobCardForRequest : selectedJob?.id;
        const currentRequest = jobCardId ? partsRequestsData[jobCardId] : null;

        if (!currentRequest) {
            showWarning("No active parts request found for this job card.");
            return;
        }

        try {
            setLoading(true);
            const request = await jobCardPartsRequestService.approveByScManager(
                currentRequest.id,
                userInfo?.name || "SC Manager"
            );

            setPartsRequestsData((prev) => ({
                ...prev,
                [jobCardId || ""]: request,
            }));

            showSuccess("Parts request approved by SC Manager.");
        } catch (error) {
            console.error("Failed to approve request:", error);
            showError("Failed to approve request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInventoryManagerPartsApproval = async (isTechnician: boolean) => {
        const jobCardId = isTechnician ? selectedJobCardForRequest : selectedJob?.id;
        const currentRequest = jobCardId ? partsRequestsData[jobCardId] : null;

        if (!currentRequest) {
            showWarning("No active parts request found for this job card.");
            return;
        }

        try {
            setLoading(true);
            const engineerName = currentRequest.requestedBy || "Service Engineer";
            const request = await jobCardPartsRequestService.assignPartsByInventoryManager(
                currentRequest.id,
                userInfo?.name || "Inventory Manager",
                engineerName
            );

            setPartsRequestsData((prev) => ({
                ...prev,
                [jobCardId || ""]: request,
            }));

            showSuccess("Parts assigned to engineer by Inventory Manager.");
        } catch (error) {
            console.error("Failed to assign parts:", error);
            showError("Failed to assign parts. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleWorkCompletionNotification = (jobId?: string) => {
        const targetJobId = jobId || selectedJob?.id || selectedJobCardForRequest;
        if (!targetJobId) return;

        const targetJob = jobCards.find((job) => job.id === targetJobId);
        if (!targetJob) return;

        setWorkCompletion((prev) => ({
            ...prev,
            [targetJobId]: true,
        }));

        const updatedJobCards = jobCards.map((job) =>
            job.id === targetJobId
                ? { ...job, status: "Completed" as JobCardStatus, completedAt: new Date().toLocaleString() }
                : job
        );
        setJobCards(updatedJobCards);
        safeStorage.setItem("jobCards", updatedJobCards);

        showSuccess("Work completion notified to manager.");
    };

    const handleSubmitToManager = () => {
        if (!selectedJob) {
            showWarning("Please select a job card to submit.");
            return;
        }

        const updatedJobCards = jobCards.map((job) =>
            job.id === selectedJob.id
                ? { ...job, status: "Created" as JobCardStatus, submittedToManager: true, submittedAt: new Date().toLocaleString() }
                : job
        );
        setJobCards(updatedJobCards);
        safeStorage.setItem("jobCards", updatedJobCards);

        showSuccess("Job card submitted to manager successfully.");
    };

    const handleCreateInvoice = () => {
        if (!selectedJob) {
            showWarning("Please select a job card to create invoice.");
            return;
        }

        if (selectedJob.status !== "Completed") {
            showWarning("Job card must be completed before creating invoice.");
            return;
        }

        try {
            const serviceCenterContext = getServiceCenterContext();
            const serviceCenterId = String(serviceCenterContext.serviceCenterId ?? "1");
            const serviceCenterCode = SERVICE_CENTER_CODE_MAP_LOCAL[serviceCenterId] || "SC001";

            let serviceCenterState = "Delhi";
            if (serviceCenterId === "2" || serviceCenterId === "sc-002") {
                serviceCenterState = "Maharashtra";
            } else if (serviceCenterId === "3" || serviceCenterId === "sc-003") {
                serviceCenterState = "Karnataka";
            }

            const serviceCenter = {
                id: serviceCenterId,
                code: serviceCenterCode,
                name: serviceCenterContext.serviceCenterName || selectedJob.serviceCenterName || "Service Center",
                state: serviceCenterState,
                address: "123 Service Center Address",
                city: serviceCenterState === "Delhi" ? "New Delhi" : serviceCenterState === "Maharashtra" ? "Mumbai" : "Bangalore",
                pincode: "110001",
                gstNumber: "29ABCDE1234F1Z5",
                panNumber: "ABCDE1234F",
            };

            const invoiceData = populateInvoiceFromJobCard(selectedJob, serviceCenter);
            const existingInvoices = safeStorage.getItem<ServiceCenterInvoice[]>("invoices", []);
            const currentYear = new Date().getFullYear();
            // generateInvoiceNumber might rely on legacy params, need to check its signature.
            // Assuming it matches: (prefix, year, existingList)
            const invoiceNumber = generateInvoiceNumber(serviceCenterCode, currentYear, existingInvoices);

            const newInvoice: ServiceCenterInvoice = {
                ...invoiceData,
                id: invoiceNumber,
                invoiceNumber: invoiceNumber,
                customerName: invoiceData.customerName || "",
                vehicle: invoiceData.vehicle || "",
                date: invoiceData.date || new Date().toISOString().split("T")[0],
                dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                amount: invoiceData.amount || invoiceData.grandTotal?.toString() || "0",
                paidAmount: invoiceData.paidAmount || "0",
                balance: invoiceData.balance || invoiceData.amount || invoiceData.grandTotal?.toString() || "0",
                items: invoiceData.items || [],
                jobCardId: selectedJob.id,
                status: "Unpaid",
                createdBy: userInfo?.name || "System",
            };

            existingInvoices.push(newInvoice);
            safeStorage.setItem("invoices", existingInvoices);

            const updatedJobCards = jobCards.map((job) =>
                job.id === selectedJob.id
                    ? {
                        ...job,
                        status: "Invoiced" as JobCardStatus,
                        invoiceNumber,
                        invoiceCreatedAt: new Date().toLocaleString(),
                        invoiceSentToAdvisor: false,
                    }
                    : job
            );
            setJobCards(updatedJobCards);
            safeStorage.setItem("jobCards", updatedJobCards);

            if (selectedJob.id) {
                const existingLeads = safeStorage.getItem<any[]>("leads", []);
                const leadIndex = existingLeads.findIndex((l) => l.jobCardId === selectedJob.id);

                if (leadIndex !== -1) {
                    const lead = existingLeads[leadIndex];
                    const updatedNotes = lead.notes
                        ? `${lead.notes}\nService completed and invoiced on ${new Date().toLocaleString()}. Invoice: ${invoiceNumber}`
                        : `Service completed and invoiced on ${new Date().toLocaleString()}. Invoice: ${invoiceNumber}`;

                    existingLeads[leadIndex] = {
                        ...lead,
                        status: "converted" as const,
                        notes: updatedNotes,
                        updatedAt: new Date().toISOString(),
                    };
                    safeStorage.setItem("leads", existingLeads);
                }
            }

            router.push(`/sc/invoices?invoiceId=${invoiceNumber}`);
            showSuccess(`Invoice ${invoiceNumber} created successfully! Redirecting to invoice page...`);
        } catch (error) {
            console.error("Error creating invoice:", error);
            showError("Failed to create invoice. Please try again.");
        }
    };

    const handleSendInvoiceToCustomer = () => {
        if (!selectedJob || !selectedJob.invoiceNumber) {
            showWarning("No invoice found for this job card.");
            return;
        }

        const updatedJobCards = jobCards.map((job) =>
            job.id === selectedJob.id
                ? {
                    ...job,
                    invoiceSentToCustomer: true,
                    invoiceSentAt: new Date().toLocaleString(),
                }
                : job
        );
        setJobCards(updatedJobCards);
        safeStorage.setItem("jobCards", updatedJobCards);

        showSuccess("Invoice sent to customer successfully.");
    };

    return {
        // States
        selectedJob, setSelectedJob,
        showDetails, setShowDetails,
        showCreateModal, setShowCreateModal,
        showAssignEngineerModal, setShowAssignEngineerModal,
        showStatusUpdateModal, setShowStatusUpdateModal,
        showMobileFilters, setShowMobileFilters,
        showPartsRequestModal, setShowPartsRequestModal,
        loading,
        assigningJobId, setAssigningJobId,
        updatingStatusJobId, setUpdatingStatusJobId,
        newStatus, setNewStatus,
        selectedEngineer, setSelectedEngineer,
        selectedJobCardForRequest, setSelectedJobCardForRequest,
        partsRequestsData, setPartsRequestsData,
        workCompletion,
        engineers,

        // Actions
        handleJobCardCreated,
        assignEngineer,
        updateStatus,
        handleAssignEngineer,
        handleStatusUpdate,
        handleManagerQuoteAction,
        handlePartRequestSubmit,
        handleServiceManagerPartApproval,
        handleInventoryManagerPartsApproval,
        handleWorkCompletionNotification,
        handleSubmitToManager,
        handleCreateInvoice,
        handleSendInvoiceToCustomer
    };
}
