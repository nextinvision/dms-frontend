import * as React from 'react';
import { FileText, Wrench, Car, User, Calendar, Eye, Edit, Clock, Banknote } from 'lucide-react';
import { JobCard, JobCardStatus, Priority } from '@/shared/types';
import { UserInfo } from '@/shared/types/auth.types';
import { JobCardPartsRequest } from '@/shared/types/jobcard-inventory.types';
import { getVehicleDisplayString, getAssignedEngineerName } from "@/features/job-cards/utils/job-card-helpers";

interface JobCardListProps {
    currentJobs: JobCard[];
    activeTab?: string;
    partsRequestsData: Record<string, JobCardPartsRequest>;
    getStatusColor: (status: JobCardStatus) => string;
    getPriorityColor: (priority: Priority) => string;
    onJobClick: (job: JobCard) => void;
    isServiceAdvisor?: boolean;
    isServiceManager?: boolean;
    isTechnician?: boolean;
    userInfo?: UserInfo | null;
    onView?: (jobId: string) => void;
    onCreateQuotation?: (job: JobCard) => void;
    onEditDraft?: (job: JobCard) => void;
    onEdit?: (jobId: string) => void;
    onAssignEngineer?: (jobId: string) => void;
    onUpdateStatus?: (jobId: string, initialStatus: JobCardStatus) => void;
    getNextStatus?: (status: JobCardStatus) => JobCardStatus[];
    hasQuotation?: (jobId: string) => boolean;
    onPassToManager?: (job: JobCard) => void;
    onCreateInvoice?: (job: JobCard) => void;
}


const JobCardList = React.memo<JobCardListProps>(({
    currentJobs,
    activeTab,
    partsRequestsData,
    getStatusColor,
    getPriorityColor,
    onJobClick,
    isServiceAdvisor,
    isServiceManager,
    isTechnician,
    userInfo,
    onView,
    onCreateQuotation,
    onEditDraft,
    onEdit,
    onAssignEngineer,
    onUpdateStatus,
    getNextStatus,
    hasQuotation,
    onPassToManager,
    onCreateInvoice,
}) => {
    if (currentJobs.length === 0) {
        return (
            <div className="p-6 text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500">No {activeTab?.replace("_", " ") || "available"} jobs found</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-x-auto">
            {currentJobs.map((job) => {
                const jobCardId = job.id || job.jobCardNumber;
                const request = partsRequestsData[jobCardId] || partsRequestsData[job.id] || partsRequestsData[job.jobCardNumber || ""];
                const reqStatus = request?.status;
                const isScApproved = request?.scManagerApproved || reqStatus === 'APPROVED' || reqStatus === 'COMPLETED' || reqStatus === 'PARTIALLY_APPROVED';
                const isPartsAssigned = request?.inventoryManagerAssigned || reqStatus === 'COMPLETED';
                const isRejected = reqStatus === 'REJECTED';
                const hasPendingRequest = request && !isScApproved && !isPartsAssigned && !isRejected;

                return (
                    <div
                        key={job.id}
                        className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 cursor-pointer min-w-[800px]"
                        onClick={() => onJobClick(job)}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-semibold">
                                    {job.jobCardNumber || job.id}
                                </span>
                                <span
                                    className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                        job.status
                                    )}`}
                                >
                                    {job.status}
                                </span>
                                <span
                                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${getPriorityColor(
                                        job.priority
                                    )}`}
                                    title={job.priority}
                                ></span>
                                {hasPendingRequest && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
                                        Parts Request Pending
                                    </span>
                                )}
                                {isRejected && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200">
                                        Parts Rejected
                                    </span>
                                )}
                                {isScApproved && !isPartsAssigned && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium border border-green-200">
                                        ✓ Parts Approved
                                    </span>
                                )}
                                {isPartsAssigned && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                                        ✓ Parts Assigned
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 gap-3 md:gap-4 mb-3">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User size={16} className="text-gray-400 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm md:text-base truncate">{job.customerName}</span>
                                        {job.customer?.phone && (
                                            <span className="text-xs text-gray-500">{job.customer.phone}</span>
                                        )}
                                        {job.customer?.email && (
                                            <span className="text-xs text-gray-400 truncate max-w-[200px]">{job.customer.email}</span>
                                        )}
                                    </div>
                                </div>


                                <div className="flex items-center gap-2 text-gray-700">
                                    <Car size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm md:text-base truncate">
                                        {getVehicleDisplayString(job.vehicle)}
                                    </span>
                                    <span className="text-gray-500 text-xs md:text-sm hidden sm:inline">• {job.registration}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Wrench size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm md:text-base truncate">{job.serviceType}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm md:text-base truncate">{job.createdAt}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Banknote size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm md:text-base truncate">{job.estimatedCost || "No Estimate"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm md:text-base truncate">{job.estimatedTime || "No Time Est."}</span>
                                </div>
                            </div>

                            <p className="text-gray-600 text-xs md:text-sm mb-2 line-clamp-2 break-words">{job.description}</p>

                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 md:gap-4 text-xs md:text-sm">
                                {job.assignedEngineer && (
                                    <span className="text-gray-500 truncate">
                                        Engineer: <span className="font-medium text-gray-700">
                                            {getAssignedEngineerName(job.assignedEngineer)}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[120px]">
                            <div className="flex gap-2">
                                {onView && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onView(job.id);
                                        }}
                                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-200 transition inline-flex items-center gap-1 justify-center"
                                    >
                                        <Eye size={14} />
                                        View
                                    </button>
                                )}
                                {isServiceAdvisor && job.status === "AWAITING_QUOTATION_APPROVAL" && job.isTemporary && onCreateQuotation && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!hasQuotation?.(job.id)) {
                                                onCreateQuotation(job);
                                            }
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition inline-flex items-center gap-1 justify-center ${hasQuotation?.(job.id)
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                                        disabled={hasQuotation?.(job.id)}
                                        title={hasQuotation?.(job.id) ? "Quotation already created" : "Create Quotation"}
                                    >
                                        <FileText size={14} />
                                        {hasQuotation?.(job.id) ? "Quotation Created" : "Create Quotation"}
                                    </button>
                                )}
                                {isServiceAdvisor && job.draftIntake && job.sourceAppointmentId && onEditDraft && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditDraft(job);
                                        }}
                                        className="flex-1 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-yellow-100 transition inline-flex items-center gap-1 justify-center"
                                    >
                                        <Edit size={14} />
                                        Edit Draft
                                    </button>
                                )}
                                {isServiceManager && onEdit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(job.id);
                                        }}
                                        className="flex-1 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-blue-100 transition inline-flex items-center gap-1 justify-center"
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isServiceManager && job.status === "CREATED" && onAssignEngineer && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignEngineer(job.id);
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition w-full"
                                >
                                    Assign Engineer
                                </button>
                            )}

                            {isServiceManager && getNextStatus && getNextStatus(job.status).length > 0 && onUpdateStatus && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateStatus(job.id, job.status);
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition w-full"
                                >
                                    Update Status
                                </button>
                            )}

                            {isServiceAdvisor && job.isTemporary && onPassToManager && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!job.passedToManager) {
                                            onPassToManager(job);
                                        }
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition w-full flex items-center justify-center gap-1 ${job.passedToManager
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                        : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90 shadow-sm"
                                        }`}
                                    disabled={job.passedToManager}
                                >
                                    <Clock size={14} />
                                    {job.passedToManager ? "Sent to Manager" : "Submit for Approval"}
                                </button>
                            )}

                            {(isServiceManager || isServiceAdvisor) && job.status === "COMPLETED" && onCreateInvoice && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Create invoice for job card ${job.jobCardNumber || job.id}?`)) {
                                            onCreateInvoice(job);
                                        }
                                    }}
                                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition w-full flex items-center justify-center gap-1 shadow-sm"
                                >
                                    <FileText size={14} />
                                    Create Invoice
                                </button>
                            )}

                            {isTechnician && !isServiceManager && !isServiceAdvisor && onUpdateStatus && (
                                <div className="space-y-2">
                                    {job.status === "ASSIGNED" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Start work on job card ${job.jobCardNumber || job.id}?`)) {
                                                    onUpdateStatus(job.id, "IN_PROGRESS");
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                                        >
                                            Start Work (In Progress)
                                        </button>
                                    )}
                                    {job.status === "IN_PROGRESS" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Mark job card ${job.jobCardNumber || job.id} as completed?`)) {
                                                    onUpdateStatus(job.id, "COMPLETED");
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                            )}

                            {isTechnician && !job.assignedEngineer && (
                                <p className="text-xs text-blue-600 font-medium text-center bg-blue-50 py-1 rounded">Click to view details</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default JobCardList;
