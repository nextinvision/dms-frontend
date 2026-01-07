"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/contexts/ToastContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, Eye, UserCheck, FileText, ShieldCheck, ShieldX, X, Car, User, Phone, Calendar, Wrench, AlertCircle, Search, ClipboardList, Package } from "lucide-react";
const safeStorage = {
  getItem: <T,>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  setItem: <T,>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }
};
import type { Quotation } from "@/shared/types";
import type { JobCard, PartsRequest } from "@/shared/types/job-card.types";
import { getServiceCenterContext, filterByServiceCenter, shouldFilterByServiceCenter } from "@/shared/lib/serviceCenter";

// Service Intake Request types (matching appointments page)
// Import from shared types
import type { DocumentationFiles } from '@/shared/types/documentation.types';
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { quotationsService } from "@/features/quotations/services/quotations.service";

interface ServiceIntakeForm {
  customerIdProof: DocumentationFiles;
  vehicleRCCopy: DocumentationFiles;
  warrantyCardServiceBook: DocumentationFiles;
  photosVideos: DocumentationFiles;
  vehicleBrand: string;
  vehicleModel: string;
  registrationNumber: string;
  vinChassisNumber: string;
  variantBatteryCapacity: string;
  motorNumber: string;
  chargerSerialNumber: string;
  dateOfPurchase: string;
  warrantyStatus: string;
  insuranceStartDate: string;
  insuranceEndDate: string;
  insuranceCompanyName: string;
  serviceType: string;
  customerComplaint: string;
  previousServiceHistory: string;
  estimatedServiceTime: string;
  estimatedCost: string;
  odometerReading: string;
  estimatedDeliveryDate: string;
  assignedServiceAdvisor: string;
  assignedTechnician: string;
  pickupDropRequired: boolean;
  pickupAddress: string;
  dropAddress: string;
  preferredCommunicationMode: "Phone" | "Email" | "SMS" | "WhatsApp" | "";
  paymentMethod: "Cash" | "Card" | "UPI" | "Online" | "Cheque" | "";
  gstRequirement: boolean;
  businessNameForInvoice: string;
  jobCardId?: string;
  arrivalMode?: "vehicle_present" | "vehicle_absent" | "";
  checkInNotes?: string;
  checkInSlipNumber?: string;
  checkInDate?: string;
  checkInTime?: string;
}

interface AppointmentRecord {
  id: number;
  customerName: string;
  vehicle: string;
  phone: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  [key: string]: any;
}

interface ServiceIntakeRequest {
  id: string;
  appointmentId: number;
  appointment: AppointmentRecord;
  serviceIntakeForm: ServiceIntakeForm;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  serviceCenterId?: number | string;
  serviceCenterName?: string;
}

export default function Approvals() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([]);
  const [serviceIntakeRequests, setServiceIntakeRequests] = useState<ServiceIntakeRequest[]>([]);
  const [jobCardApprovals, setJobCardApprovals] = useState<JobCard[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceIntakeRequest | null>(null);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showJobCardModal, setShowJobCardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Service center context for filtering
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
  const shouldFilter = shouldFilterByServiceCenter(serviceCenterContext);
  const { showSuccess, showError, showInfo } = useToast();

  // Modal States
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const [rejectionModalState, setRejectionModalState] = useState<{
    isOpen: boolean;
    targetId: string | null;
    type: 'QUOTATION' | 'JOB_CARD' | 'PARTS_REQUEST' | 'SERVICE_INTAKE' | null;
  }>({
    isOpen: false,
    targetId: null,
    type: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const openConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const openRejection = (id: string, type: 'QUOTATION' | 'JOB_CARD' | 'PARTS_REQUEST' | 'SERVICE_INTAKE') => {
    setRejectionModalState({
      isOpen: true,
      targetId: id,
      type,
    });
    setRejectionReason("");
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      showError("Please provide a reason for rejection.");
      return;
    }
    const { targetId, type } = rejectionModalState;
    if (!targetId || !type) return;

    try {
      if (type === 'QUOTATION') {
        await quotationsService.managerReview(targetId, { status: "REJECTED", notes: rejectionReason });
        refreshQuotations();
        showInfo("Quotation rejected.");
      } else if (type === 'JOB_CARD') {
        await jobCardService.managerReview(targetId, { status: "REJECTED", notes: rejectionReason });
        refreshJobCards();
        showInfo("Job card rejected.");
      } else if (type === 'PARTS_REQUEST') {
        await jobCardService.updatePartsRequestStatus(targetId, "REJECTED", rejectionReason);
        refreshPartsRequests();
        showInfo("Parts Request rejected.");
      } else if (type === 'SERVICE_INTAKE') {
        processServiceIntakeRejection(targetId, rejectionReason);
      }
      setRejectionModalState({ isOpen: false, targetId: null, type: null });
      setRejectionReason("");
    } catch (error) {
      console.error("Rejection failed", error);
      showError("Failed to reject request.");
    }
  };

  // Helper functions to refresh data
  const refreshQuotations = async () => {
    const queryParams: any = { status: 'SENT_TO_MANAGER' };
    if (shouldFilter && serviceCenterContext.serviceCenterId) {
      queryParams.serviceCenterId = serviceCenterContext.serviceCenterId;
    }
    const finalQuotations = await quotationsService.getAll(queryParams);
    setQuotations(finalQuotations);
  };

  const refreshJobCards = async () => {
    const queryParams: any = {
      passedToManager: 'true',
      managerReviewStatus: 'PENDING'
    };
    if (shouldFilter && serviceCenterContext.serviceCenterId) {
      queryParams.serviceCenterId = serviceCenterContext.serviceCenterId;
    }
    const pendingJobCards = await jobCardService.getAll(queryParams);
    setJobCardApprovals(pendingJobCards);
  };

  const refreshPartsRequests = async () => {
    const pendingParts = await jobCardService.getPendingPartsRequests(
      shouldFilter && serviceCenterContext.serviceCenterId ? String(serviceCenterContext.serviceCenterId) : undefined
    );
    setPartsRequests(pendingParts);
  };

  const processServiceIntakeRejection = (requestId: string, reason: string) => {
    const allRequests = safeStorage.getItem<ServiceIntakeRequest[]>("serviceIntakeRequests", []);
    const updatedRequests = allRequests.map((r) =>
      r.id === requestId
        ? {
          ...r,
          status: "rejected" as const,
          rejectedAt: new Date().toISOString(),
          rejectedBy: "Service Manager",
          rejectionReason: reason,
        }
        : r
    );
    safeStorage.setItem("serviceIntakeRequests", updatedRequests);
    setServiceIntakeRequests(updatedRequests.filter((r) => r.status === "pending"));
    setShowRequestModal(false);
    setSelectedRequest(null);
    showInfo("Service intake request rejected!");
  };

  // Load quotations and service intake requests from localStorage
  useEffect(() => {
    const loadData = async () => {
      // Load quotations
      // Load quotations from API
      try {
        const queryParams: any = { status: 'SENT_TO_MANAGER' };
        if (shouldFilter && serviceCenterContext.serviceCenterId) {
          queryParams.serviceCenterId = serviceCenterContext.serviceCenterId;
        }

        const finalQuotations = await quotationsService.getAll(queryParams);
        setQuotations(finalQuotations);
      } catch (error) {
        console.error("Failed to load quotations:", error);
        setQuotations([]);
      }

      // Load service intake requests
      let storedRequests = safeStorage.getItem<ServiceIntakeRequest[]>("serviceIntakeRequests", []);

      // Check if we have any pending service intake requests
      const hasPendingRequests = storedRequests.some(r => r.status === "pending");




      // Reload from localStorage
      storedRequests = safeStorage.getItem<ServiceIntakeRequest[]>("serviceIntakeRequests", []);
      let pendingRequests = storedRequests.filter(
        (r) => r.status === "pending"
      );

      // Filter by service center if needed
      if (shouldFilter) {
        pendingRequests = filterByServiceCenter(pendingRequests, serviceCenterContext);
      }

      setServiceIntakeRequests(pendingRequests);

      // Fetch real pending job cards from API
      try {
        const queryParams: any = {
          passedToManager: 'true',
          managerReviewStatus: 'PENDING'
        };

        if (shouldFilter && serviceCenterContext.serviceCenterId) {
          queryParams.serviceCenterId = serviceCenterContext.serviceCenterId;
        }

        const pendingJobCards = await jobCardService.getAll(queryParams);
        setJobCardApprovals(pendingJobCards);
      } catch (error) {
        console.error("Failed to fetch pending job cards:", error);
        setJobCardApprovals([]);
      }

      // Load pending parts requests
      try {
        const pendingParts = await jobCardService.getPendingPartsRequests(
          shouldFilter && serviceCenterContext.serviceCenterId ? String(serviceCenterContext.serviceCenterId) : undefined
        );
        setPartsRequests(pendingParts);
      } catch (error) {
        console.error("Failed to fetch pending parts requests:", error);
        setPartsRequests([]);
      }
    };

    loadData();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for same-tab updates (30 seconds)
    const interval = setInterval(loadData, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [shouldFilter, serviceCenterContext]);

  // Filter requests and quotations by search query
  const filteredServiceIntakeRequests = useMemo(() => {
    if (!searchQuery.trim()) return serviceIntakeRequests;

    const query = searchQuery.toLowerCase();
    return serviceIntakeRequests.filter((request) => {
      const customerName = request.appointment.customerName?.toLowerCase() || "";
      const vehicle = request.appointment.vehicle?.toLowerCase() || "";
      const phone = request.appointment.phone?.toLowerCase() || "";
      const serviceType = request.serviceIntakeForm.serviceType?.toLowerCase() || request.appointment.serviceType?.toLowerCase() || "";
      const complaint = request.serviceIntakeForm.customerComplaint?.toLowerCase() || request.appointment.customerComplaint?.toLowerCase() || "";
      const requestId = request.id?.toLowerCase() || "";

      return customerName.includes(query) ||
        vehicle.includes(query) ||
        phone.includes(query) ||
        serviceType.includes(query) ||
        complaint.includes(query) ||
        requestId.includes(query);
    });
  }, [serviceIntakeRequests, searchQuery]);

  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotations;

    const query = searchQuery.toLowerCase();
    return quotations.filter((quotation) => {
      const customerName = `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.toLowerCase();
      const vehicle = `${quotation.vehicle?.make || ""} ${quotation.vehicle?.model || ""}`.toLowerCase();
      const quotationNumber = quotation.quotationNumber?.toLowerCase() || "";

      return customerName.includes(query) ||
        vehicle.includes(query) ||
        quotationNumber.includes(query);
    });
  }, [quotations, searchQuery]);

  const filteredJobCardApprovals = useMemo(() => {
    if (!searchQuery.trim()) return jobCardApprovals;

    const query = searchQuery.toLowerCase();
    return jobCardApprovals.filter((jobCard) => {
      const customerName = jobCard.customerName?.toLowerCase() || "";
      const vehicle = jobCard.vehicle?.toLowerCase() || "";
      const registration = jobCard.registration?.toLowerCase() || "";
      const jobCardNumber = jobCard.jobCardNumber?.toLowerCase() || jobCard.id?.toLowerCase() || "";
      const serviceType = jobCard.serviceType?.toLowerCase() || "";
      const description = jobCard.description?.toLowerCase() || "";

      return customerName.includes(query) ||
        vehicle.includes(query) ||
        registration.includes(query) ||
        jobCardNumber.includes(query) ||
        serviceType.includes(query) ||
        description.includes(query);
    });
  }, [jobCardApprovals, searchQuery]);

  const filteredPartsRequests = useMemo(() => {
    if (!searchQuery.trim()) return partsRequests;

    const query = searchQuery.toLowerCase();
    return partsRequests.filter((req) => {
      const customerName = req.jobCard?.customerName?.toLowerCase() || "";
      const vehicle = `${req.jobCard?.vehicleMake || ""} ${req.jobCard?.vehicleModel || ""} ${req.jobCard?.registration || ""}`.toLowerCase();
      const jobCardNumber = req.jobCard?.jobCardNumber?.toLowerCase() || "";
      const items = req.items.map(i => i.partName.toLowerCase()).join(" ");

      return customerName.includes(query) ||
        vehicle.includes(query) ||
        jobCardNumber.includes(query) ||
        items.includes(query);
    });
  }, [partsRequests, searchQuery]);

  const handleApproveQuotation = async (quotationId: string) => {
    openConfirmation(
      "Approve Quotation",
      "Are you sure you want to approve this quotation?",
      async () => {
        try {
          await quotationsService.managerReview(quotationId, { status: "APPROVED", notes: "Approved by manager" });
          await refreshQuotations();
          showSuccess("Quotation approved by manager!");
        } catch (error) {
          console.error("Failed to approve quotation", error);
          showError("Failed to approve quotation");
        }
      }
    );
  };

  const handleRejectQuotation = (quotationId: string) => {
    openRejection(quotationId, 'QUOTATION');
  };

  const handleApproveServiceIntake = (requestId: string): void => {
    openConfirmation(
      "Approve Request",
      "Approve this service intake request?",
      () => {
        const allRequests = safeStorage.getItem<ServiceIntakeRequest[]>("serviceIntakeRequests", []);
        const updatedRequests = allRequests.map((r) =>
          r.id === requestId
            ? {
              ...r,
              status: "approved" as const,
              approvedAt: new Date().toISOString(),
              approvedBy: "Service Manager",
            }
            : r
        );
        safeStorage.setItem("serviceIntakeRequests", updatedRequests);
        setServiceIntakeRequests(updatedRequests.filter((r) => r.status === "pending"));
        setShowRequestModal(false);
        setSelectedRequest(null);
        showSuccess("Service intake request approved!");
      }
    );
  };

  const handleRejectServiceIntake = (requestId: string): void => {
    openRejection(requestId, 'SERVICE_INTAKE');
  };

  const handleApproveJobCard = async (jobCardId: string) => {
    openConfirmation(
      "Approve Job Card",
      "Approve this job card? This will allow technician assignment and parts monitoring.",
      async () => {
        try {
          await jobCardService.managerReview(jobCardId, { status: "APPROVED", notes: "Approved via Web Portal" });
          await refreshJobCards();
          setShowJobCardModal(false);
          setSelectedJobCard(null);
          showSuccess("Job card approved! You can now assign a technician.");
        } catch (error) {
          console.error("Approval failed", error);
          showError("Failed to approve job card. Please try again.");
        }
      }
    );
  };

  const handleRejectJobCard = async (jobCardId: string) => {
    openRejection(jobCardId, 'JOB_CARD');
  };

  const handleApprovePartsRequest = async (requestId: string) => {
    openConfirmation(
      "Approve Parts Request",
      "Approve this parts request? This will authorize the parts issue.",
      async () => {
        try {
          await jobCardService.updatePartsRequestStatus(requestId, "APPROVED");
          await refreshPartsRequests();
          showSuccess("Parts Request Approved!");
        } catch (error) {
          console.error("Failed to approve parts request", error);
          showError("Failed to approve parts request");
        }
      }
    );
  };

  const handleRejectPartsRequest = async (requestId: string) => {
    openRejection(requestId, 'PARTS_REQUEST');
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Approvals</h1>
          <p className="text-gray-500">Review and approve pending requests</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer name, vehicle, phone, service type, or request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Job Card Approvals Section */}
          {filteredJobCardApprovals.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Job Card Approvals {filteredJobCardApprovals.length > 0 && `(${filteredJobCardApprovals.length})`}
              </h2>
              <div className="space-y-4">
                {filteredJobCardApprovals.map((jobCard) => (
                  <div key={jobCard.id} className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <ClipboardList className="text-indigo-600" size={20} />
                          <span className="font-semibold text-lg">{jobCard.jobCardNumber || jobCard.id}</span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Pending Approval
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700">
                            <span className="font-semibold">Customer:</span> {
                              jobCard.customerName ||
                              jobCard.part1?.fullName ||
                              jobCard.part1Data?.fullName ||
                              jobCard.customer?.name ||
                              "N/A"
                            }
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Vehicle:</span> {
                              (typeof jobCard.vehicle === 'string' ? jobCard.vehicle : `${jobCard.vehicle?.vehicleMake || ''} ${jobCard.vehicle?.vehicleModel || ''}`) ||
                              jobCard.vehicleMake && `${jobCard.vehicleMake} ${jobCard.vehicleModel || ''}` ||
                              jobCard.part1?.vehicleModel && `${jobCard.part1.vehicleBrand || ''} ${jobCard.part1.vehicleModel}` ||
                              jobCard.part1Data?.vehicleModel && `${jobCard.part1Data.vehicleBrand || ''} ${jobCard.part1Data.vehicleModel}` ||
                              "N/A"
                            }
                            {` (${jobCard.registration ||
                              jobCard.part1?.registrationNumber ||
                              jobCard.part1Data?.registrationNumber ||
                              (typeof jobCard.vehicle !== 'string' ? jobCard.vehicle?.registration : '') ||
                              "No Reg"})`}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Service Type:</span> {
                              jobCard.serviceType ||
                              jobCard.part1?.serviceType ||
                              "General Service"
                            }
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Description:</span> {
                              jobCard.description ||
                              jobCard.part1?.customerFeedback ||
                              jobCard.part1Data?.customerFeedback ||
                              "N/A"
                            }
                          </p>
                          {jobCard.parts && jobCard.parts.length > 0 && (
                            <p className="text-gray-700">
                              <span className="font-semibold">Required Parts:</span> {jobCard.parts.join(", ")}
                            </p>
                          )}
                          {jobCard.estimatedCost && (
                            <p className="text-gray-700">
                              <span className="font-semibold">Estimated Cost:</span>{" "}
                              <span className="text-green-600 font-bold">{jobCard.estimatedCost}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Submitted: {jobCard.submittedAt ? new Date(jobCard.submittedAt).toLocaleString("en-IN") : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => router.push(`/sc/job-cards/${jobCard.id}`)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
                        >
                          <Eye size={18} />
                          View Details
                        </button>
                        <button
                          onClick={() => handleApproveJobCard(jobCard.id)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldCheck size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectJobCard(jobCard.id)}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldX size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parts Request Approvals Section */}
          {filteredPartsRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Parts Request Approvals {filteredPartsRequests.length > 0 && `(${filteredPartsRequests.length})`}
              </h2>
              <div className="space-y-4">
                {filteredPartsRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="text-orange-600" size={20} />
                          <span className="font-semibold text-lg">Parts Request</span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Pending Approval
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700">
                            <span className="font-semibold">Job Card:</span> {request.jobCard?.jobCardNumber || "N/A"}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Customer:</span> {request.jobCard?.customerName}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Vehicle:</span> {request.jobCard?.vehicleObject ?
                              `${request.jobCard.vehicleObject.vehicleMake} ${request.jobCard.vehicleObject.vehicleModel} (${request.jobCard.vehicleObject.registration})` :
                              (typeof request.jobCard?.vehicle === 'string' ? request.jobCard?.vehicle : request.jobCard?.registration)}
                          </p>
                          <div className="mt-2 bg-gray-50 p-3 rounded-md">
                            <span className="font-semibold text-gray-700 block mb-1">Requested Items:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {request.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.partName} {item.partNumber && `(${item.partNumber})`} - Qty: {item.requestedQty}
                                  {item.isWarranty && <span className="ml-2 text-green-600 text-xs font-semibold px-1 border border-green-200 rounded">Warranty</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Requested: {new Date(request.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprovePartsRequest(request.id)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldCheck size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPartsRequest(request.id)}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldX size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Intake Requests Section */}
          {filteredServiceIntakeRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Service Intake Requests {filteredServiceIntakeRequests.length > 0 && `(${filteredServiceIntakeRequests.length})`}
              </h2>
              <div className="space-y-4">
                {filteredServiceIntakeRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Wrench className="text-purple-600" size={20} />
                          <span className="font-semibold text-lg">Service Intake Request</span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Pending Approval
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700">
                            <span className="font-semibold">Customer:</span> {
                              request.appointment?.customerName ||
                              request.appointment?.customer?.name ||
                              (request.appointment?.customer?.firstName ? `${request.appointment.customer.firstName} ${request.appointment.customer.lastName || ''}` : "") ||
                              "N/A"
                            }
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Vehicle:</span> {request.appointment.vehicle}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Service Type:</span> {request.serviceIntakeForm.serviceType || request.appointment.serviceType}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Complaint:</span> {
                              request.serviceIntakeForm.customerComplaint ||
                              request.appointment.customerComplaint ||
                              request.appointment.description ||
                              request.appointment.title ||
                              "N/A"
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted: {request.submittedAt ? new Date(request.submittedAt).toLocaleString("en-IN") : "N/A"}
                            {request.submittedBy && ` by ${request.submittedBy}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRequestModal(true);
                          }}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
                        >
                          <Eye size={18} />
                          View Details
                        </button>
                        <button
                          onClick={() => handleApproveServiceIntake(request.id)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldCheck size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectServiceIntake(request.id)}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                        >
                          <ShieldX size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotations Section */}
          <div className={filteredServiceIntakeRequests.length > 0 ? "mt-8" : ""}>
            {filteredServiceIntakeRequests.length > 0 && (
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Quotation Approvals {filteredQuotations.length > 0 && `(${filteredQuotations.length})`}
              </h2>
            )}
            {filteredQuotations.length === 0 && filteredServiceIntakeRequests.length === 0 && filteredJobCardApprovals.length === 0 && filteredPartsRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Pending Approvals</h3>
                <p className="text-gray-500">
                  {searchQuery.trim()
                    ? "No requests match your search criteria."
                    : "There are no requests pending your approval at this time."}
                </p>
              </div>
            ) : filteredQuotations.length > 0 ? (
              filteredQuotations.map((quotation) => (
                <div key={quotation.id} className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="text-blue-600" size={20} />
                        <span className="font-semibold text-lg">{quotation.quotationNumber}</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Pending Approval
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-gray-700">
                          <span className="font-semibold">Customer:</span>{" "}
                          {quotation.customer?.firstName || ""} {quotation.customer?.lastName || ""}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Vehicle:</span>{" "}
                          {quotation.vehicle?.make || ""} {quotation.vehicle?.model || ""} ({quotation.vehicle?.registration || ""})
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Total Amount:</span>{" "}
                          <span className="text-green-600 font-bold">₹{quotation.totalAmount.toLocaleString("en-IN")}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(quotation.quotationDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>

                      {/* Customer Approval Status */}
                      {quotation.customerApproved && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="text-green-600" size={18} />
                            <span className="font-semibold text-green-700">Approved by Customer</span>
                          </div>
                          {quotation.customerApprovedAt && (
                            <p className="text-sm text-green-600 ml-6">
                              Approved on: {new Date(quotation.customerApprovedAt).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      )}

                      {quotation.customerRejected && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="text-red-600" size={18} />
                            <span className="font-semibold text-red-700">Rejected by Customer</span>
                          </div>
                          {quotation.customerRejectedAt && (
                            <p className="text-sm text-red-600 ml-6">
                              Rejected on: {new Date(quotation.customerRejectedAt).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Quotation Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveQuotation(quotation.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectQuotation(quotation.id)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                      >
                        <ShieldX size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))) : null}
          </div>

          <ConfirmModal
            isOpen={confirmModalState.isOpen}
            onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
            onConfirm={() => {
              confirmModalState.onConfirm();
              setConfirmModalState(prev => ({ ...prev, isOpen: false }));
            }}
            title={confirmModalState.title}
            message={confirmModalState.message}
            type="warning"
            confirmText="Approve"
          />

          <Modal
            isOpen={rejectionModalState.isOpen}
            onClose={() => setRejectionModalState({ isOpen: false, targetId: null, type: null })}
            title="Reject Request"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600">Please provide a reason for rejecting this request.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => setRejectionModalState({ isOpen: false, targetId: null, type: null })}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectionSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>

        </div>

        {/* Service Intake Request Detail Modal */}
        {
          showRequestModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Service Intake Request Details</h2>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Appointment Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="text-blue-600" size={20} />
                      Appointment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                        <p className="font-medium text-gray-800">{selectedRequest.appointment.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-800">{selectedRequest.appointment.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                        <p className="font-medium text-gray-800">{selectedRequest.appointment.vehicle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Appointment Date</p>
                        <p className="font-medium text-gray-800">{selectedRequest.appointment.date} at {selectedRequest.appointment.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Car className="text-blue-600" size={20} />
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle Brand</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.vehicleBrand || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle Model</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.vehicleModel || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Registration Number</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.registrationNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">VIN/Chassis Number</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.vinChassisNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Variant/Battery Capacity</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.variantBatteryCapacity || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Motor Number</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.motorNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Charger Serial Number</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.chargerSerialNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date of Purchase</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.dateOfPurchase || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Warranty Status</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.warrantyStatus || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Odometer Reading</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.odometerReading || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Wrench className="text-purple-600" size={20} />
                      Service Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Service Type</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.serviceType || selectedRequest.appointment.serviceType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer Complaint/Issue</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.customerComplaint || selectedRequest.appointment.customerComplaint || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Previous Service History</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.previousServiceHistory || selectedRequest.appointment.previousServiceHistory || "N/A"}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Estimated Service Time</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.estimatedServiceTime || selectedRequest.appointment.estimatedServiceTime || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Estimated Cost</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.estimatedCost || selectedRequest.appointment.estimatedCost || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Estimated Delivery Date</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.estimatedDeliveryDate || selectedRequest.appointment.estimatedDeliveryDate || "N/A"}</p>
                        </div>
                      </div>
                      {selectedRequest.serviceIntakeForm.checkInNotes && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Check-in Notes</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.checkInNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insurance Information */}
                  {(selectedRequest.serviceIntakeForm.insuranceStartDate || selectedRequest.serviceIntakeForm.insuranceEndDate || selectedRequest.serviceIntakeForm.insuranceCompanyName) && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Insurance Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Insurance Company</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.insuranceCompanyName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Start Date</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.insuranceStartDate || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">End Date</p>
                          <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.insuranceEndDate || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Details */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Operational Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Assigned Service Advisor</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.assignedServiceAdvisor || selectedRequest.appointment.assignedServiceAdvisor || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Assigned Technician</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.assignedTechnician || selectedRequest.appointment.assignedTechnician || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Pickup/Drop Required</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.pickupDropRequired || selectedRequest.appointment.pickupDropRequired ? "Yes" : "No"}</p>
                      </div>
                      {selectedRequest.serviceIntakeForm.pickupDropRequired && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Pickup Address</p>
                            <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.pickupAddress || selectedRequest.appointment.pickupAddress || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Drop Address</p>
                            <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.dropAddress || selectedRequest.appointment.dropAddress || "N/A"}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Preferred Communication</p>
                        <p className="font-medium text-gray-800">{selectedRequest.serviceIntakeForm.preferredCommunicationMode || selectedRequest.appointment.preferredCommunicationMode || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documentation Status */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer ID Proof</p>
                        <p className="font-medium text-gray-800">
                          {selectedRequest.serviceIntakeForm.customerIdProof?.urls?.length > 0
                            ? `${selectedRequest.serviceIntakeForm.customerIdProof.urls.length} file(s)`
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle RC Copy</p>
                        <p className="font-medium text-gray-800">
                          {selectedRequest.serviceIntakeForm.vehicleRCCopy?.urls?.length > 0
                            ? `${selectedRequest.serviceIntakeForm.vehicleRCCopy.urls.length} file(s)`
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Warranty Card/Service Book</p>
                        <p className="font-medium text-gray-800">
                          {selectedRequest.serviceIntakeForm.warrantyCardServiceBook?.urls?.length > 0
                            ? `${selectedRequest.serviceIntakeForm.warrantyCardServiceBook.urls.length} file(s)`
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Photos/Videos</p>
                        <p className="font-medium text-gray-800">
                          {selectedRequest.serviceIntakeForm.photosVideos?.urls?.length > 0
                            ? `${selectedRequest.serviceIntakeForm.photosVideos.urls.length} file(s)`
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowRequestModal(false);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleRejectServiceIntake(selectedRequest.id)}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <ShieldX size={18} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveServiceIntake(selectedRequest.id)}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={18} />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }


      </div >
    </div >
  );
}


