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
        <div className="p-4 md:p-6 space-y-4">
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
                        className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                        onClick={() => onJobClick(job)}
                    >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-5 py-3.5 border-b border-gray-100">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-sm">
                                        #{job.jobCardNumber || job.id}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border shadow-sm ${getStatusColor(job.status)}`}
                                    >
                                        {job.status.replace(/_/g, ' ')}
                                    </span>
                                    <div
                                        className={`w-3 h-3 rounded-full ${getPriorityColor(job.priority)} ring-2 ring-white shadow-sm`}
                                        title={`${job.priority} Priority`}
                                    ></div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {hasPendingRequest && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium border border-orange-200">
                                            Parts Pending
                                        </span>
                                    )}
                                    {isRejected && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">
                                            Parts Rejected
                                        </span>
                                    )}
                                    {isScApproved && !isPartsAssigned && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium border border-green-200">
                                            ✓ Parts Approved
                                        </span>
                                    )}
                                    {isPartsAssigned && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                                            ✓ Parts Assigned
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5">
                            <div className="flex flex-col lg:flex-row gap-5">
                                {/* Main Content */}
                                <div className="flex-1 space-y-4">
                                    {/* Customer & Vehicle Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <User size={18} className="text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-500 mb-0.5">Customer</p>
                                                <p className="font-semibold text-gray-900 text-sm truncate">{job.customerName}</p>
                                                {job.customer?.phone && (
                                                    <p className="text-xs text-gray-600 mt-0.5">{job.customer.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Car size={18} className="text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-500 mb-0.5">Vehicle</p>
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {getVehicleDisplayString(job.vehicle)}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">{job.registration}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Details */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="flex items-center gap-2">
                                            <Wrench size={16} className="text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500">Service</p>
                                                <p className="font-medium text-gray-900 text-sm truncate">{job.serviceType}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Banknote size={16} className="text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500">Estimate</p>
                                                <p className="font-medium text-gray-900 text-sm truncate">{job.estimatedCost || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500">Time</p>
                                                <p className="font-medium text-gray-900 text-sm">{job.estimatedTime || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {job.description && (
                                        <div className="pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Description</p>
                                            <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>{job.createdAt}</span>
                                        </div>
                                        {job.assignedEngineer && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                                    {getAssignedEngineerName(job.assignedEngineer).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-700">{getAssignedEngineerName(job.assignedEngineer)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 lg:w-48 lg:border-l lg:border-gray-100 lg:pl-5">
                                    <div className="flex gap-2">
                                        {onView && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onView(job.id);
                                                }}
                                                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition inline-flex items-center gap-1 justify-center"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        )}
                                        {isServiceAdvisor && job.isTemporary && !job.quotation && !job.quotationId && onCreateQuotation && (() => {
                                            const hasWarrantyItems = job.part2?.some((item) => item.partWarrantyTag || item.isWarranty) || false;
                                            if (!hasWarrantyItems && !job.passedToManager) {
                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!hasQuotation?.(job.id)) {
                                                                onCreateQuotation(job);
                                                            }
                                                        }}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 justify-center ${hasQuotation?.(job.id)
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                                                        disabled={hasQuotation?.(job.id)}
                                                        title={hasQuotation?.(job.id) ? "Quotation already created" : "Create Quotation"}
                                                    >
                                                        <FileText size={14} />
                                                        {hasQuotation?.(job.id) ? "Quotation Created" : "Create Quotation"}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()}
                                        {isServiceAdvisor && job.draftIntake && job.sourceAppointmentId && onEditDraft && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditDraft(job);
                                                }}
                                                className="flex-1 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-50 transition inline-flex items-center gap-1 justify-center"
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
                                                className="flex-1 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition inline-flex items-center gap-1 justify-center"
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    {isServiceManager && job.status === "CREATED" && onAssignEngineer && (() => {
                                        const hasDetails = job.quotation || job.quotationId;
                                        const isApproved = job.quotation?.customerApproved || (job as any).quotationApproved || false;
                                        const hasQuotation = job.quotation || job.quotationId;
                                        const canAssign = !hasQuotation || isApproved;

                                        return (
                                            <div className="w-full relative group">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canAssign) onAssignEngineer(job.id);
                                                    }}
                                                    disabled={!canAssign}
                                                    title={!canAssign ? "Quotation must be approved by customer first" : ""}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition w-full ${!canAssign ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:opacity-90 shadow-sm'}`}
                                                >
                                                    Assign Engineer
                                                </button>
                                                {!canAssign && (
                                                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max p-1 bg-gray-800 text-white text-[10px] rounded shadow-lg z-10">
                                                        Quotation pending approval
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {isServiceManager && getNextStatus && getNextStatus(job.status).length > 0 && onUpdateStatus && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(job.id, job.status);
                                            }}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition w-full shadow-sm"
                                        >
                                            Update Status
                                        </button>
                                    )}

                                    {isServiceAdvisor && job.isTemporary && onPassToManager && (() => {
                                        const hasWarrantyItems = job.part2?.some((item) => item.partWarrantyTag || item.isWarranty) || false;
                                        const managerStatus = (job as any).managerReviewStatus;

                                        if (hasWarrantyItems) {
                                            if (job.passedToManager) {
                                                let statusText = "Sent to Manager";
                                                let statusClass = "bg-yellow-100 text-yellow-700 border-yellow-200";

                                                if (managerStatus === "APPROVED") {
                                                    statusText = "✓ Manager Approved";
                                                    statusClass = "bg-green-100 text-green-700 border-green-200";
                                                } else if (managerStatus === "REJECTED") {
                                                    statusText = "✗ Manager Rejected";
                                                    statusClass = "bg-red-100 text-red-700 border-red-200";
                                                } else if (managerStatus === "PENDING") {
                                                    statusText = "⏳ Awaiting Approval";
                                                    statusClass = "bg-orange-100 text-orange-700 border-orange-200";
                                                }

                                                return (
                                                    <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${statusClass} text-center w-full`}>
                                                        {statusText}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPassToManager(job);
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-xs font-medium transition w-full flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90 shadow-sm"
                                                >
                                                    <Clock size={14} />
                                                    Pass to Manager
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {(isServiceManager || isServiceAdvisor) && job.status === "COMPLETED" && onCreateInvoice && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Create invoice for job card ${job.jobCardNumber || job.id}?`)) {
                                                    onCreateInvoice(job);
                                                }
                                            }}
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition w-full flex items-center justify-center gap-1 shadow-sm"
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
                                                    Start Work
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
                                                    Mark Completed
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isTechnician && !job.assignedEngineer && (
                                        <p className="text-xs text-blue-600 font-medium text-center bg-blue-50 py-1.5 rounded">Click to view details</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default JobCardList;
