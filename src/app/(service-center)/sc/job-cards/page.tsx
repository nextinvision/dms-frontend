"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import {
  Plus, Search, Filter, CheckCircle, Loader2, UserCheck, X, Clock, User,
  Wrench, AlertCircle, Package, FileText, Eye, Edit, Car, Calendar, ClipboardList
} from "lucide-react";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/core/contexts/ToastContext";


// Components
import JobCardFilters from "./components/JobCardFilters";
import JobCardList from "./components/JobCardList";
import JobCardKanban from "./components/JobCardKanban";
import JobCardActions from "./components/JobCardActions";

// Hooks
import { useJobCardView } from "@/features/job-cards/hooks/useJobCardView";
import { useJobCardActions } from "@/features/job-cards/hooks/useJobCardActions";

// Constants & Types
import { SERVICE_TYPE_OPTIONS } from "@/shared/constants/service-types";
import type { JobCard, JobCardStatus, JobCardFilterType } from "@/shared/types/job-card.types";
import { hasActiveQuotation } from "@/shared/utils/quotation.utils";

// Lazy load modals to improve initial load
const JobCardDetailsModal = dynamic(() => import("./components/JobCardDetailsModal"), {
  loading: () => <p>Loading details...</p>
});
const PartsRequestModal = dynamic(() => import("./components/PartsRequestModal"));
const AssignEngineerModal = dynamic(() => import("./components/AssignEngineerModal"));
const StatusUpdateModal = dynamic(() => import("./components/StatusUpdateModal"));

const SERVICE_TYPES = SERVICE_TYPE_OPTIONS;

// Import job card helper functions
import { getJobCardVehicleDisplay, getJobCardCustomerName } from "@/features/job-cards/utils/job-card-helpers";

// Import JobCardTable component (regular import to avoid chunk loading issues)
import JobCardTable from "./components/JobCardTable";

const getStatusColor = (status: JobCardStatus): string => {
  const colors: Record<JobCardStatus, string> = {
    ARRIVAL_PENDING: "bg-gray-100 text-gray-700 border-gray-300",
    JOB_CARD_PENDING_VEHICLE: "bg-blue-50 text-blue-700 border-blue-200",
    JOB_CARD_ACTIVE: "bg-yellow-100 text-yellow-700 border-yellow-300",
    CHECK_IN_ONLY: "bg-indigo-50 text-indigo-700 border-indigo-200",
    NO_RESPONSE_LEAD: "bg-red-100 text-red-700 border-red-200",
    MANAGER_QUOTE: "bg-purple-50 text-purple-700 border-purple-200",
    AWAITING_QUOTATION_APPROVAL: "bg-amber-100 text-amber-700 border-amber-300",
    CREATED: "bg-gray-100 text-gray-700 border-gray-300",
    ASSIGNED: "bg-blue-100 text-blue-700 border-blue-300",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-300",
    PARTS_PENDING: "bg-orange-100 text-orange-700 border-orange-300",
    COMPLETED: "bg-green-100 text-green-700 border-green-300",
    INVOICED: "bg-purple-100 text-purple-700 border-purple-300",
  };
  return colors[status] || colors.CREATED;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    LOW: "bg-gray-500",
    NORMAL: "bg-blue-500",
    HIGH: "bg-orange-500",
    CRITICAL: "bg-red-500",
  };
  return colors[priority] || "bg-gray-500";
};

export default function JobCards() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. View & Data Hook
  const {
    view, setView,
    filter, setFilter,
    searchQuery, setSearchQuery,
    visibleJobCards,
    filteredJobs,
    draftCount,
    pendingApprovalCount,
    activeCount,
    kanbanColumns,
    getJobsByStatus,
    isLoading,
    jobCards,
    setJobCards,
    userRole,
    userInfo,
    isTechnician
  } = useJobCardView();

  // 2. Actions Hook
  // Pass jobCards/setJobCards to allow optimistic updates from actions
  const {
    selectedJob, setSelectedJob,
    showDetails, setShowDetails,
    showCreateModal, setShowCreateModal,
    showAssignEngineerModal, setShowAssignEngineerModal,
    showStatusUpdateModal, setShowStatusUpdateModal,
    showMobileFilters, setShowMobileFilters,
    showPartsRequestModal, setShowPartsRequestModal,
    loading: actionLoading,
    assigningJobId, setAssigningJobId,
    updatingStatusJobId, setUpdatingStatusJobId,
    newStatus, setNewStatus,
    selectedEngineer, setSelectedEngineer,
    selectedJobCardForRequest, setSelectedJobCardForRequest,
    partsRequestsData, setPartsRequestsData,
    workCompletion,
    engineers,

    handleJobCardCreated,
    handleAssignEngineer,
    assignEngineer, // Added this
    handleStatusUpdate,
    handleManagerQuoteAction,
    handlePartRequestSubmit,
    handleServiceManagerPartApproval,
    handleWorkCompletionNotification,
    handleSubmitToManager,
    handleCreateInvoice,
    handleSendInvoiceToCustomer,
    handleManagerReview,
    updateStatus // Ensure this is exported from hook
  } = useJobCardActions(jobCards, setJobCards, userInfo);

  const isCallCenter = userRole === "call_center";
  const isServiceAdvisor = userRole === "service_advisor";
  const isServiceManager = userRole === "sc_manager";
  const isInventoryManager = userRole === "inventory_manager";

  // Service Engineer specific logic
  const [activeTab, setActiveTab] = useState<"assigned" | "in_progress" | "completed">("assigned");

  const [isClient, setIsClient] = useState(false);
  const [rejectionModalState, setRejectionModalState] = useState<{ isOpen: boolean; jobId: string | null }>({ isOpen: false, jobId: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const { showError } = useToast();
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Refresh job cards when page becomes visible (e.g., returning from quotations)
  // Only needed for advisor/manager/technician views – avoid extra refreshes for Call Center
  useEffect(() => {
    if (!(isServiceAdvisor || isServiceManager || isTechnician)) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refetch job cards when page becomes visible to show updated quotation/status
        queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, isServiceAdvisor, isServiceManager, isTechnician]);

  const jobForPanel = Boolean(selectedJob);

  // Derived state for Technician view
  const assignedJobCards = visibleJobCards; // For technician, visible cards are already filtered
  // For technicians, once a job is started, it should not jump back to "Assigned"
  // Treat PARTS_PENDING as part of the in-progress workflow so status feels persistent
  const assignedJobs = isTechnician
    ? visibleJobCards.filter((job) => job.status === "ASSIGNED")
    : [];
  const inProgressJobs = isTechnician
    ? visibleJobCards.filter(
        (job) => job.status === "IN_PROGRESS" || job.status === "PARTS_PENDING"
      )
    : [];
  const completedJobs = isTechnician
    ? visibleJobCards.filter((job) => job.status === "COMPLETED")
    : [];

  const handleEditDraft = (job: JobCard) => {
    if (!job.sourceAppointmentId) {
      router.push(`/sc/job-cards/${job.id}`);
      return;
    }
    router.push(`/sc/appointments?draft=${job.sourceAppointmentId}&jobCard=${job.id}`);
  };

  const [technicianApproved, setTechnicianApproved] = useState<boolean>(false);
  const [partsApproved, setPartsApproved] = useState<boolean>(false);

  const filterLabelMap: Record<JobCardFilterType, string> = {
    all: "All",
    active: "Active",
    created: "Created",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    draft: "Drafts",
    pending_approval: "Pending Approval",
  };
  const filterOptions: JobCardFilterType[] = ["all", "active", "created", "assigned", "in_progress", "completed", "draft", "pending_approval"];

  const handleJobCardError = (message: string) => {
    console.error(message);
    // You might want to use toast here if available
  };

  // ... (skipping some existing functions) ...

  if (isLoading || !isClient) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          </div>
        </div>
      </div>
    );
  }


  const getNextStatus = (currentStatus: JobCardStatus): JobCardStatus[] => {
    const workflow: Record<JobCardStatus, JobCardStatus[]> = {
      ARRIVAL_PENDING: ["JOB_CARD_PENDING_VEHICLE"],
      JOB_CARD_PENDING_VEHICLE: ["JOB_CARD_ACTIVE"],
      JOB_CARD_ACTIVE: ["CHECK_IN_ONLY", "MANAGER_QUOTE"],
      CHECK_IN_ONLY: ["MANAGER_QUOTE"],
      NO_RESPONSE_LEAD: [],
      MANAGER_QUOTE: ["ASSIGNED"],
      AWAITING_QUOTATION_APPROVAL: ["CREATED"],
      CREATED: ["ASSIGNED"],
      ASSIGNED: ["IN_PROGRESS"],
      IN_PROGRESS: ["PARTS_PENDING", "COMPLETED"],
      PARTS_PENDING: ["IN_PROGRESS", "COMPLETED"],
      COMPLETED: ["INVOICED"],
      INVOICED: [],
    };
    return workflow[currentStatus] || [];
  };


  // Early return for Call Center View - Read-only status checking
  if (isCallCenter) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Job Card Status Lookup</h1>
            <p className="text-gray-500">Check service status for customer inquiries</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 bg-white rounded-xl shadow-md p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name, phone, vehicle number, or job card number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            {/* Filter Buttons for Call Center */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((f) => {
                const count = f === 'draft' ? draftCount : f === 'pending_approval' ? pendingApprovalCount : f === 'active' ? activeCount : null;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                        }`}
                  >
                    {filterLabelMap[f]}
                    {count !== null && ` (${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Cards - Read Only */}
          <div className="bg-white rounded-xl shadow-md p-6">

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">
                  {searchQuery ? "No job cards found matching your search" : "No job cards available"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const jobCardId = job.id || job.jobCardNumber;
                  if (!jobCardId) {
                    console.warn('Job card missing ID:', job);
                    return null;
                  }
                  const handleClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = `/sc/job-cards/${jobCardId}`;
                    console.log('Navigating to job card:', url);
                    try {
                      router.push(url);
                    } catch (error) {
                      console.error('Router push failed, using window.location:', error);
                      window.location.href = url;
                    }
                  };
                  return (
                  <div
                    key={job.id || job.jobCardNumber}
                    onClick={handleClick}
                    className="block p-4 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(e as any);
                      }
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Job Card Number */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Job Card #</p>
                        <p className="font-semibold text-gray-900">{job.jobCardNumber || job.id}</p>
                      </div>

                      {/* Customer Name */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <p className="font-semibold text-gray-900 truncate">{getJobCardCustomerName(job)}</p>
                      </div>

                      {/* Vehicle */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p className="font-medium text-gray-700 truncate">
                          {getJobCardVehicleDisplay(job)}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info Row */}
                    <div className="mt-3 pt-3 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} />
                        <span>Created: {new Date(job.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      {job.assignedEngineer && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={14} />
                          <span>Engineer: {typeof job.assignedEngineer === 'string' ? job.assignedEngineer : job.assignedEngineer?.name || 'Assigned'}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Click indicator */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-end">
                      <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Eye size={12} />
                        Click to view details →
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-900">Information Only</p>
                <p className="text-sm text-blue-700 mt-1">
                  This view is for checking service status only. Job cards cannot be edited or modified from this screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return for Service Engineer (Technician) View
  if (isTechnician) {
    const currentJobs = activeTab === "assigned" ? assignedJobs :
      activeTab === "in_progress" ? inProgressJobs :
        completedJobs;

    const selectedJobCard = selectedJobCardForRequest
      ? visibleJobCards.find(
        (job) => job.id === selectedJobCardForRequest || job.jobCardNumber === selectedJobCardForRequest
      )
      : null;

    const activeRequest = selectedJobCardForRequest && selectedJobCard
      ? (partsRequestsData[selectedJobCardForRequest] ||
        partsRequestsData[selectedJobCard.id || ""] ||
        partsRequestsData[selectedJobCard.jobCardNumber || ""] ||
        null)
      : null;

    const handleJobCardClick = (job: JobCard) => {
      // Navigate to the full job card detail view which includes images, parts list, customer info, etc.
      router.push(`/sc/job-cards/${job.id}`);
    };

    const getJobsByStatusForTechnician = (status: JobCardStatus): JobCard[] => {
      return currentJobs.filter((job) => job.status === status);
    };

    return (
      <div className="bg-[#f9f9fb] min-h-screen p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">My Jobs</h1>
            <p className="text-gray-500">Manage your assigned job cards and parts requests</p>
          </div>

          {/* View Toggle */}
          <div className="mb-6 flex justify-end">
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${view === "kanban"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${view === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === "assigned"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Assigned ({assignedJobs.length})
              </button>
              <button
                onClick={() => setActiveTab("in_progress")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === "in_progress"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                In Progress ({inProgressJobs.length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === "completed"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Completed ({completedJobs.length})
              </button>
            </div>

            {/* Kanban View */}
            {view === "kanban" && (
              <JobCardKanban
                kanbanColumns={kanbanColumns}
                activeTab={activeTab}
                getJobsByStatus={getJobsByStatusForTechnician}
                partsRequestsData={partsRequestsData}
                onJobClick={handleJobCardClick}
                getPriorityColor={getPriorityColor}
                onUpdateStatus={async (jobId, status) => {
                  await updateStatus(jobId, status);
                  // Refresh job cards after status update
                  await queryClient.refetchQueries({ queryKey: ['job-cards'] });
                }}
                isTechnician={true}
              />
            )}

            {/* List View */}
            {view === "list" && (
              <JobCardList
                currentJobs={currentJobs}
                activeTab={activeTab}
                partsRequestsData={partsRequestsData}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onJobClick={handleJobCardClick}
                isTechnician={true}
                userInfo={userInfo}
                getNextStatus={getNextStatus}
                onUpdateStatus={async (jobId, status) => {
                  if (status) {
                    await updateStatus(jobId, status as JobCardStatus);
                    // Refresh job cards after status update
                    await queryClient.refetchQueries({ queryKey: ['job-cards'] });
                  } else {
                    setUpdatingStatusJobId(jobId);
                    const currentStatus = visibleJobCards.find(j => j.id === jobId)?.status || "ASSIGNED";
                    setNewStatus(getNextStatus(currentStatus)[0]);
                    setShowStatusUpdateModal(true);
                  }
                }}
              />
            )}
          </div>

          {/* Parts Request Modal */}
          <PartsRequestModal
            open={showPartsRequestModal}
            onClose={() => setShowPartsRequestModal(false)}
            selectedJobCard={assignedJobCards.find(job => job.id === selectedJobCardForRequest || job.jobCardNumber === selectedJobCardForRequest) || null}
            activeRequest={selectedJobCardForRequest ? partsRequestsData[selectedJobCardForRequest] : null}
            loading={actionLoading}
            onSubmit={async (jobId, items) => {
              await handlePartRequestSubmit(visibleJobCards, jobId, items);
              setShowPartsRequestModal(false);
              // Refresh job cards after parts request submission
              await queryClient.refetchQueries({ queryKey: ['job-cards'] });
            }}
            onNotifyWorkCompletion={async (jobId) => {
              handleWorkCompletionNotification(jobId);
              setShowPartsRequestModal(false);
              // Refresh job cards after work completion notification
              await queryClient.refetchQueries({ queryKey: ['job-cards'] });
            }}
            isClient={isClient}
          />
        </div>
      </div>
    );
  }



  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className={`pt-4 pb-6 md:pt-6 md:pb-10 overflow-x-hidden ${view === "kanban" ? "px-0" : "px-4 sm:px-6"}`}>
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4 ${view === "kanban" ? "px-4 sm:px-6" : ""}`}>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 md:mb-2">Job Cards</h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isTechnician ? "Your Assigned Job Cards" : isServiceAdvisor ? "Create and manage job cards" : "Manage and track service job cards"}
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-3 justify-center md:justify-start">
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300 self-center">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${view === "kanban"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${view === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                List
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${view === "table"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Table
              </button>
            </div>
            {/* Only Service Advisor can create job cards from this page */}
            {isServiceAdvisor && (
              <button
                onClick={() => router.push("/sc/job-cards/create")}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2 justify-center text-sm sm:text-base"
              >
                <Plus size={18} />
                <span>Create Job Card</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <JobCardFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showMobileFilters={showMobileFilters}
          setShowMobileFilters={setShowMobileFilters}
          filter={filter}
          setFilter={setFilter}
          filterOptions={filterOptions}
          filterLabelMap={filterLabelMap}
          view={view}
          draftCount={draftCount}
          pendingApprovalCount={pendingApprovalCount}
          activeCount={activeCount}
        />

        <JobCardActions
          isServiceAdvisor={isServiceAdvisor}
          isServiceManager={isServiceManager}
          selectedJob={selectedJob}
          technicianApproved={technicianApproved}
          setTechnicianApproved={setTechnicianApproved}
          partsApproved={partsApproved}
          setPartsApproved={setPartsApproved}
          handleSubmitToManager={handleSubmitToManager}
          handleManagerQuoteAction={handleManagerQuoteAction}
          handleManagerReview={handleManagerReview}
          handleCreateInvoice={handleCreateInvoice}
          handleSendInvoiceToCustomer={handleSendInvoiceToCustomer}
          visibleJobCards={visibleJobCards}
        />

        {/* Manager/Advisor Collaboration Panel - Not for Service Engineers */}
        {jobForPanel && !isTechnician && (
          <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Job Card Details</h3>
                <p className="text-xs text-gray-500">
                  View and manage job card information and approvals.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Kanban View */}
        {view === "kanban" && (
          <JobCardKanban
            kanbanColumns={kanbanColumns}
            getJobsByStatus={getJobsByStatus}
            partsRequestsData={partsRequestsData}
            onJobClick={(job) => {
              // Persist selected job card for faster detail loading
              safeStorage.setItem("selectedJobCardForDetail", job);
              router.push(`/sc/job-cards/${job.id}`);
            }}
            getPriorityColor={getPriorityColor}
          />
        )}

        {/* List View */}
        {view === "list" && (
          <JobCardList
            currentJobs={filteredJobs}
            partsRequestsData={partsRequestsData}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            onJobClick={(job) => {
              safeStorage.setItem("selectedJobCardForDetail", job);
              router.push(`/sc/job-cards/${job.id}`);
            }}
            isServiceAdvisor={isServiceAdvisor}
            isServiceManager={isServiceManager}
            onView={(jobId) => {
              const job = filteredJobs.find((j) => j.id === jobId);
              if (job) {
                safeStorage.setItem("selectedJobCardForDetail", job);
              }
              router.push(`/sc/job-cards/${jobId}`);
            }}
            onEdit={(jobId) => router.push(`/sc/job-cards/${jobId}/edit`)}
            onEditDraft={handleEditDraft}
            onAssignEngineer={(jobId) => {
              setAssigningJobId(jobId);
              setShowAssignEngineerModal(true);
            }}
            onUpdateStatus={(jobId, initialStatus) => {
              setUpdatingStatusJobId(jobId);
              setNewStatus(getNextStatus(initialStatus)[0]);
              setShowStatusUpdateModal(true);
            }}
            getNextStatus={getNextStatus}
            hasQuotation={(jobId) => {
              const job = filteredJobs.find(j => j.id === jobId);
              return job ? hasActiveQuotation(job) : false;
            }}
            onCreateQuotation={(job) => {
              // Persist job card context so quotations page can auto-open the modal
              if (typeof window !== "undefined") {
                const payload = {
                  jobCardId: job.id,
                  customerId: (job as any).customerId || job.customer?.id,
                  customerName: (job as any).customerName || job.customerName || job.part1?.fullName || "",
                  serviceCenterId: (job as any).serviceCenterId || serviceCenterContext.serviceCenterId,
                  vehicleId: (job as any).vehicleId || job.vehicleId,
                  jobCardData: job,
                };
                safeStorage.setItem("pendingQuotationFromJobCard", payload);
              }
              router.push(`/sc/quotations?fromJobCard=true&jobCardId=${job.id}`);
            }}
            onCreateInvoice={(job) => {
              if (handleCreateInvoice) {
                handleCreateInvoice(job);
              }
            }}
            onPassToManager={handleSubmitToManager}
          />
        )}

        {/* Table View */}
        {view === "table" && (
          <JobCardTable
            currentJobs={filteredJobs}
            partsRequestsData={partsRequestsData}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            onJobClick={(job) => router.push(`/sc/job-cards/${job.id}`)}
            isServiceAdvisor={isServiceAdvisor}
            isServiceManager={isServiceManager}
            engineers={engineers}
            onView={(jobId) => router.push(`/sc/job-cards/${jobId}`)}
            onEdit={(jobId) => router.push(`/sc/job-cards/${jobId}/edit`)}
            onEditDraft={handleEditDraft}
            onAssignEngineer={(jobId) => {
              setAssigningJobId(jobId);
              setShowAssignEngineerModal(true);
            }}
            onDirectAssignEngineer={(jobId, engineerId) => {
              const eng = engineers.find((e) => e.id.toString() === engineerId.toString());
              const name = eng ? eng.name : "this engineer";
              if (window.confirm(`Are you sure you want to assign ${name} to this job card?`)) {
                assignEngineer(jobId, engineerId);
              }
            }}
            onUpdateStatus={(jobId, initialStatus) => {
              setUpdatingStatusJobId(jobId);
              setNewStatus(getNextStatus(initialStatus)[0]);
              setShowStatusUpdateModal(true);
            }}
            onDirectUpdateStatus={(jobId, status) => {
              if (window.confirm(`Are you sure you want to update the status to ${status}?`)) {
                updateStatus(jobId, status);
              }
            }}
            getNextStatus={getNextStatus}
            hasQuotation={(jobId) => {
              const job = filteredJobs.find(j => j.id === jobId);
              return job ? hasActiveQuotation(job) : false;
            }}
            onCreateQuotation={(job) => {
              router.push(`/sc/quotations?fromJobCard=true&jobCardId=${job.id}`);
            }}
            onCreateInvoice={(job) => {
              if (handleCreateInvoice) {
                handleCreateInvoice(job);
              }
            }}
            onPassToManager={(jobId) => handleSubmitToManager(jobId)}
            onApprove={(jobId) => handleManagerReview(jobId, "APPROVED", "Approved from Table")}
            onReject={(jobId) => {
              const reason = prompt("Please provide a reason for rejection:");
              if (reason) {
                handleManagerReview(jobId, "REJECTED", reason);
              }
            }}
          />
        )}

      </div>

      {/* Job Card Details Modal */}
      <JobCardDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        job={selectedJob}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
        getNextStatus={getNextStatus}
        onAssignEngineer={(jobId) => {
          setShowDetails(false);
          setAssigningJobId(jobId);
          setShowAssignEngineerModal(true);
        }}
        onApprove={(jobId) => {
          setShowDetails(false);
          handleManagerReview(jobId, "APPROVED", "Approved from Details");
        }}
        onReject={(jobId) => {
          setShowDetails(false);
          setRejectionModalState({ isOpen: true, jobId });
          setRejectionReason("");
        }}
        onSendToManager={(jobId) => {
          setShowDetails(false);
          handleSubmitToManager(jobId);
        }}
        onUpdateStatus={async (jobId, initialStatus) => {
          setShowDetails(false);
          setUpdatingStatusJobId(jobId);
          setNewStatus(getNextStatus(initialStatus)[0]);
          setShowStatusUpdateModal(true);
        }}
        onCreateQuotation={(job) => {
          setShowDetails(false);
          router.push(`/sc/quotations?fromJobCard=true&jobCardId=${job.id}`);
        }}
        onCreateInvoice={(job) => {
          setShowDetails(false);
          if (handleCreateInvoice) {
            handleCreateInvoice(job);
          }
        }}
      />
      <Modal
        isOpen={rejectionModalState.isOpen}
        onClose={() => setRejectionModalState({ isOpen: false, jobId: null })}
        title="Reject Job Card"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejection.</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={() => setRejectionModalState({ isOpen: false, jobId: null })}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!rejectionReason.trim()) {
                  showError("Please provide a reason.");
                  return;
                }
                if (rejectionModalState.jobId) {
                  handleManagerReview(rejectionModalState.jobId, "REJECTED", rejectionReason);
                  setRejectionModalState({ isOpen: false, jobId: null });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>



      {/* Assign Engineer Modal */}
      <AssignEngineerModal
        open={showAssignEngineerModal && !!assigningJobId}
        onClose={() => {
          setShowAssignEngineerModal(false);
          setAssigningJobId(null);
          setSelectedEngineer("");
        }}
        engineers={engineers}
        selectedEngineer={selectedEngineer}
        onSelectEngineer={setSelectedEngineer}
        onSubmit={handleAssignEngineer}
        loading={actionLoading}
      />

      {/* Update Status Modal */}
      <StatusUpdateModal
        open={showStatusUpdateModal && !!updatingStatusJobId}
        onClose={async () => {
          setShowStatusUpdateModal(false);
          setUpdatingStatusJobId(null);
          // Refresh job cards when modal closes (in case status was updated)
          await queryClient.refetchQueries({ queryKey: ['job-cards'] });
        }}
        currentStatus={visibleJobCards.find((j) => j.id === updatingStatusJobId)?.status || "CREATED"}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        onSubmit={async () => {
          await handleStatusUpdate();
          // Refresh job cards after status update
          await queryClient.refetchQueries({ queryKey: ['job-cards'] });
        }}
        loading={actionLoading}
        getNextStatus={getNextStatus}
      />
    </div >
  );
}
