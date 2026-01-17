import * as React from 'react';
import {
    Eye, Edit, UserPlus, RefreshCw, FileText, Clock,
    Calendar, Car, User, Phone, MapPin, DollarSign, Wrench,
    TrendingUp, ChevronDown, ChevronUp, ArrowRight,
    CheckCircle, XCircle
} from 'lucide-react';
import { JobCard, JobCardStatus, Priority } from '@/shared/types';
import { UserInfo } from '@/shared/types/auth.types';
import { JobCardPartsRequest } from '@/shared/types/jobcard-inventory.types';
import { getJobCardVehicleDisplay, getAssignedEngineerName } from "@/features/job-cards/utils/job-card-helpers";

interface JobCardTableProps {
    currentJobs: JobCard[];
    partsRequestsData: Record<string, JobCardPartsRequest>;
    getStatusColor: (status: JobCardStatus) => string;
    getPriorityColor: (priority: Priority) => string;
    onJobClick: (job: JobCard) => void;
    isServiceAdvisor?: boolean;
    isServiceManager?: boolean;
    isTechnician?: boolean;
    userInfo?: UserInfo | null;
    engineers?: any[]; // Allow any for flexibility, ideal is User[]
    onView?: (jobId: string) => void;
    onCreateQuotation?: (job: JobCard) => void;
    onEditDraft?: (job: JobCard) => void;
    onEdit?: (jobId: string) => void;
    onAssignEngineer?: (jobId: string) => void;
    onDirectAssignEngineer?: (jobId: string, engineerId: string) => void;
    onUpdateStatus?: (jobId: string, status: JobCardStatus) => void;
    onDirectUpdateStatus?: (jobId: string, status: JobCardStatus) => void;
    getNextStatus?: (status: JobCardStatus) => JobCardStatus[];
    hasQuotation?: (jobId: string) => boolean;
    onPassToManager?: (jobId: string) => void;
    onApprove?: (jobId: string) => void;
    onReject?: (jobId: string) => void;
    onCreateInvoice?: (job: JobCard) => void;
}

const JobCardTable = React.memo<JobCardTableProps>(({
    currentJobs,
    partsRequestsData,
    getStatusColor,
    getPriorityColor,
    onJobClick,
    isServiceAdvisor,
    isServiceManager,
    isTechnician,
    userInfo,
    engineers = [],
    onView,
    onCreateQuotation,
    onEditDraft,
    onEdit,
    onAssignEngineer,
    onDirectAssignEngineer,
    onUpdateStatus,
    onDirectUpdateStatus,
    getNextStatus,
    hasQuotation,
    onPassToManager,
    onApprove,
    onReject,
    onCreateInvoice,
}) => {
    const [sortColumn, setSortColumn] = React.useState<string>('createdAt');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const toggleRowExpansion = (jobId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId);
        } else {
            newExpanded.add(jobId);
        }
        setExpandedRows(newExpanded);
    };

    const sortedJobs = React.useMemo(() => {
        return [...currentJobs].sort((a, b) => {
            let aValue: any = a[sortColumn as keyof JobCard];
            let bValue: any = b[sortColumn as keyof JobCard];

            // Handle date sorting
            if (sortColumn === 'createdAt') {
                aValue = new Date(aValue || 0).getTime();
                bValue = new Date(bValue || 0).getTime();
            }

            // Handle string sorting
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [currentJobs, sortColumn, sortDirection]);

    // Helper to get customer name from job card
    const getCustomerName = (job: JobCard): string => {
        // Try to find a name from any available source
        const nameSource = (
            (job.customer?.name) ||
            (job.customerName) ||
            (job.part1?.fullName)
        )?.trim();

        const phone = (job.customer?.phone || job.part1?.mobilePrimary || '').trim();

        if (nameSource && nameSource !== phone) {
            // Avoid double-appending if the phone is already in the name string
            if (phone && nameSource.includes(`(${phone})`)) return nameSource;
            return phone ? `${nameSource} (${phone})` : nameSource;
        }

        return nameSource || phone || 'Unknown Customer';
    };

    const getRegistration = (job: JobCard): string => {
        if (job.vehicleObject?.registration) {
            return job.vehicleObject.registration;
        }
        if (job.registration) return job.registration;
        if (job.part1?.registrationNumber) return job.part1.registrationNumber;
        const part1Data = (job as any).part1Data;
        if (part1Data?.registrationNumber) return part1Data.registrationNumber;
        if (part1Data?.registration_number) return part1Data.registration_number;
        return 'N/A';
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const SortableHeader = ({ column, label }: { column: string; label: string }) => (
        <th
            onClick={() => handleSort(column)}
            className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all border-b border-gray-200"
        >
            <div className="flex items-center gap-2">
                {label}
                {sortColumn === column && (
                    <span className="text-blue-600">
                        {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                )}
            </div>
        </th>
    );

    if (currentJobs.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={56} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Job Cards Found</h3>
                <p className="text-gray-500">No job cards match the current filter criteria.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <tr>
                            <SortableHeader column="jobCardNumber" label="Job Card" />
                            <SortableHeader column="status" label="Status" />
                            <SortableHeader column="priority" label="Priority" />
                            <SortableHeader column="customerName" label="Customer" />
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">Vehicle</th>
                            <SortableHeader column="serviceType" label="Service Type" />
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">Engineer</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">Parts</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">Estimated</th>
                            <SortableHeader column="createdAt" label="Created" />
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedJobs.map((job) => {
                            const jobCardId = job.id || job.jobCardNumber;
                            const request = partsRequestsData[jobCardId] || partsRequestsData[job.id] || partsRequestsData[job.jobCardNumber || ""];
                            const hasRequest = request && !request.inventoryManagerAssigned;
                            const isExpanded = expandedRows.has(job.id);

                            return (
                                <React.Fragment key={job.id}>
                                    <tr
                                        className="hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer group"
                                        onClick={() => onJobClick(job)}
                                    >
                                        {/* Job Card Number */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold shadow-sm">
                                                {job.jobCardNumber || job.id}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border shadow-sm ${getStatusColor(job.status)}`}>
                                                    {job.status.replace(/_/g, ' ')}
                                                </span>
                                                {hasRequest && (
                                                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium border border-orange-200">
                                                        Parts Pending
                                                    </span>
                                                )}
                                                {request?.inventoryManagerAssigned && (
                                                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium border border-green-200">
                                                        ✓ Parts Assigned
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Priority */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(job.priority)} ring-2 ring-white shadow-sm`}></div>
                                                <span className="text-sm font-medium text-gray-700">{job.priority}</span>
                                            </div>
                                        </td>

                                        {/* Customer */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <User size={16} className="text-blue-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {getCustomerName(job)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <Car size={16} className="text-purple-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <div className="text-gray-900 font-medium">{getJobCardVehicleDisplay(job)}</div>
                                                    <div className="text-gray-500 text-xs">{getRegistration(job)}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Service Type */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <Wrench size={16} className="text-green-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{job.serviceType}</span>
                                            </div>
                                        </td>

                                        {/* Engineer */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {isServiceManager && job.status !== 'COMPLETED' && job.status !== 'INVOICED' ? (() => {
                                                const hasDetails = job.quotation || job.quotationId;
                                                // Check customer approval
                                                const isApproved = job.quotation?.customerApproved || (job as any).quotationApproved || false;
                                                // Can assign if no quotation needed yet OR if quotation exists and is approved
                                                // BUT usually quotation is created before assignment?
                                                // Requirement: "until customer approved the quotation manager cant be assigned technician"
                                                // This implies if quotation exists, it MUST be approved.
                                                // If no quotation exists yet, can we assign? Assuming yes or no depending on workflow.
                                                // usually job card created -> assign engineer -> inspection -> quotation. 
                                                // BUT if workflow is: inspection -> quotaion -> assign repair engineer?
                                                // The prompt says "until customer approved ... cant be assigned".
                                                // So if a quotation IS PENDING, we cant assign.

                                                // Let's assume:
                                                // 1. If no quotation, logic doesn't apply (or allowed).
                                                // 2. If quotation exists, it must be approved.

                                                const hasQuotation = job.quotation || job.quotationId;
                                                const canAssign = !hasQuotation || isApproved;

                                                return (
                                                    <div className="relative group">
                                                        <select
                                                            value={job.assignedEngineer && typeof job.assignedEngineer === 'object' ? job.assignedEngineer.id : (engineers.find(e => e.name === job.assignedEngineer)?.id || "")}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val && onDirectAssignEngineer) {
                                                                    onDirectAssignEngineer(job.id, val);
                                                                }
                                                            }}
                                                            disabled={!canAssign}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`p-1 px-2 text-xs border rounded focus:ring-blue-500 focus:border-blue-500 w-full ${!canAssign ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300'}`}
                                                            style={{ minWidth: '140px' }}
                                                            title={!canAssign ? "Quotation must be approved by customer first" : ""}
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {engineers.map((eng: any) => (
                                                                <option key={eng.id} value={eng.id}>
                                                                    {eng.name || `${eng.firstName || ''} ${eng.lastName || ''}`.trim()}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {!canAssign && (
                                                            <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-max p-1 bg-gray-800 text-white text-[10px] rounded shadow-lg z-10">
                                                                Quotation pending customer approval
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })() : (
                                                <span className="text-sm text-gray-700">
                                                    {getAssignedEngineerName(job.assignedEngineer)}
                                                </span>
                                            )}
                                        </td>

                                        {/* Parts Status */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {(() => {
                                                const partsRequest = (job.partsRequests && job.partsRequests.length > 0)
                                                    ? job.partsRequests[0]
                                                    : (request as any); // Fallback to prop-based request if available

                                                if (!partsRequest) {
                                                    return <span className="text-gray-400 text-xs">-</span>;
                                                }

                                                const status = partsRequest.status || 'PENDING';
                                                let badgeClass = "bg-gray-100 text-gray-700 border-gray-300";

                                                switch (status) {
                                                    case 'PENDING':
                                                        badgeClass = "bg-orange-100 text-orange-700 border-orange-200";
                                                        break;
                                                    case 'APPROVED':
                                                    case 'PARTIALLY_APPROVED':
                                                    case 'COMPLETED': // Assuming completed means issued
                                                        badgeClass = "bg-green-100 text-green-700 border-green-200";
                                                        break;
                                                    case 'REJECTED':
                                                        badgeClass = "bg-red-100 text-red-700 border-red-200";
                                                        break;
                                                    default:
                                                        break;
                                                }

                                                return (
                                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${badgeClass}`}>
                                                        {status === 'COMPLETED' ? 'ISSUED' : status}
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        {/* Estimated Cost & Time */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="text-gray-900 font-medium">
                                                    {job.estimatedCost || 'N/A'}
                                                </div>
                                                <div className="text-gray-500 text-xs flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {job.estimatedTime || 'N/A'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Created Date */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-700">{formatDate(job.createdAt)}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {onView && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onView(job.id);
                                                        }}
                                                        className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-150"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}

                                                {/* Create Quotation Button - Show only for temp job cards WITHOUT warranty items and quotation not created */}
                                                {isServiceAdvisor && job.isTemporary && !job.quotation && !job.quotationId && onCreateQuotation && (() => {
                                                    // Check if job has any warranty items
                                                    const hasWarrantyItems = job.part2?.some((item: any) => item.partWarrantyTag || item.isWarranty) || false;

                                                    // Show Create Quotation only if NO warranty items and NOT passed to manager
                                                    if (!hasWarrantyItems && !job.passedToManager) {
                                                        return (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!hasQuotation?.(job.id)) {
                                                                        onCreateQuotation(job);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded transition ${hasQuotation?.(job.id)
                                                                    ? "text-gray-300 cursor-not-allowed"
                                                                    : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"}`}
                                                                title={hasQuotation?.(job.id) ? "Quotation Already Created" : "Create Quotation"}
                                                                disabled={hasQuotation?.(job.id)}
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {/* Pass to Manager Button - Show only for temp job cards WITH warranty items */}
                                                {isServiceAdvisor && job.isTemporary && onPassToManager && (() => {
                                                    // Check if job has any warranty items
                                                    const hasWarrantyItems = job.part2?.some((item: any) => item.partWarrantyTag || item.isWarranty) || false;

                                                    // Get manager review status
                                                    const managerStatus = (job as any).managerReviewStatus;

                                                    // Show button only if HAS warranty items
                                                    if (hasWarrantyItems) {
                                                        // If already passed to manager, show status badge instead
                                                        if (job.passedToManager) {
                                                            let statusText = "Sent to Manager";
                                                            let statusClass = "bg-yellow-100 text-yellow-700 border-yellow-200";

                                                            if (managerStatus === "APPROVED") {
                                                                statusText = "Manager Approved";
                                                                statusClass = "bg-green-100 text-green-700 border-green-200";
                                                            } else if (managerStatus === "REJECTED") {
                                                                statusText = "Manager Rejected";
                                                                statusClass = "bg-red-100 text-red-700 border-red-200";
                                                            } else if (managerStatus === "PENDING") {
                                                                statusText = "Awaiting Approval";
                                                                statusClass = "bg-orange-100 text-orange-700 border-orange-200";
                                                            }

                                                            return (
                                                                <span
                                                                    className={`px-2 py-1 rounded text-xs font-medium border ${statusClass}`}
                                                                    title={`Manager review status: ${managerStatus || 'Sent'}`}
                                                                >
                                                                    {statusText}
                                                                </span>
                                                            );
                                                        }

                                                        // Show Pass to Manager button
                                                        return (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onPassToManager(job.id);
                                                                }}
                                                                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition"
                                                                title="Pass to Manager for Approval"
                                                            >
                                                                <ArrowRight size={16} />
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
                                                        className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition"
                                                        title="Edit Draft"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {/* Manage Approve/Reject Visibility: Only if PENDING */}
                                                {isServiceManager && job.passedToManager && (job as any).managerReviewStatus === 'PENDING' && (
                                                    <>
                                                        {onApprove && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onApprove(job.id);
                                                                }}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        )}
                                                        {onReject && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onReject(job.id);
                                                                }}
                                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {isServiceManager && onEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(job.id);
                                                        }}
                                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
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
                                                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition"
                                                        title="Create Invoice"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}

                                                {/* Status Update Dropdown */}
                                                {isServiceManager && getNextStatus && getNextStatus(job.status).length > 0 && onDirectUpdateStatus && (
                                                    <div onClick={e => e.stopPropagation()} className="inline-block relative">
                                                        <select
                                                            onChange={(e) => onDirectUpdateStatus(job.id, e.target.value as JobCardStatus)}
                                                            className="p-1 px-2 text-xs border border-purple-200 rounded focus:ring-purple-500 focus:border-purple-500 bg-purple-50 text-purple-700 font-medium cursor-pointer"
                                                            value=""
                                                            style={{ paddingRight: '20px', appearance: 'none' }}
                                                        >
                                                            <option value="" disabled>Update Status</option>
                                                            {getNextStatus(job.status).map(status => (
                                                                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-purple-700">
                                                            <RefreshCw size={12} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-50"><td colSpan={10} className="px-4 py-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200"><div className="lg:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Description</label><p className="mt-1 text-sm text-gray-700">{job.description || 'No description provided'}</p></div><div><label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><MapPin size={12} />Location</label><p className="mt-1 text-sm text-gray-700">{job.location === 'DOORSTEP' ? 'Home Service' : 'Station'}</p></div>{job.customerType && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Customer Type</label><p className="mt-1 text-sm text-gray-700">{job.customerType}</p></div>)}<div><label className="text-xs font-semibold text-gray-500 uppercase">Vehicle Details</label><p className="mt-1 text-sm text-gray-700">{job.vehicleMake} {job.vehicleModel}</p></div>{job.serviceCenterName && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Service Center</label><p className="mt-1 text-sm text-gray-700">{job.serviceCenterName}</p></div>)}{job.customerArrivalTimestamp && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Customer Arrival</label><p className="mt-1 text-sm text-gray-700">{formatDate(job.customerArrivalTimestamp)}</p></div>)}{job.parts && job.parts.length > 0 && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Parts</label><p className="mt-1 text-sm text-gray-700">{job.parts.length} parts requested</p></div>)}<div className="lg:col-span-3"><label className="text-xs font-semibold text-gray-500 uppercase">Job Card ID</label><p className="mt-1 text-xs text-gray-500 font-mono">{job.id}</p></div></div></td></tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-bold text-gray-900">{sortedJobs.length}</span> job cards
                    </div>
                    <div className="flex items-center gap-5 text-xs font-medium text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
                            <span>Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200"></span>
                            <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200"></span>
                            <span>Urgent</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

JobCardTable.displayName = 'JobCardTable';

export default JobCardTable;
