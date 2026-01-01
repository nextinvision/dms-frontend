import * as React from 'react';
import {
    Eye, Edit, UserPlus, RefreshCw, FileText, Clock,
    Calendar, Car, User, Phone, MapPin, DollarSign, Wrench,
    TrendingUp, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';
import { JobCard, JobCardStatus, Priority } from '@/shared/types';
import { UserInfo } from '@/shared/types/auth.types';
import { JobCardPartsRequest } from '@/shared/types/jobcard-inventory.types';

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
    onView?: (jobId: string) => void;
    onCreateQuotation?: (job: JobCard) => void;
    onEditDraft?: (job: JobCard) => void;
    onEdit?: (jobId: string) => void;
    onAssignEngineer?: (jobId: string) => void;
    onUpdateStatus?: (jobId: string, status: JobCardStatus) => void;
    getNextStatus?: (status: JobCardStatus) => JobCardStatus[];
    hasQuotation?: (jobId: string) => boolean;
    onPassToManager?: (jobId: string) => void;
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
    onView,
    onCreateQuotation,
    onEditDraft,
    onEdit,
    onAssignEngineer,
    onUpdateStatus,
    getNextStatus,
    hasQuotation,
    onPassToManager,
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

    // Helper to get vehicle display string
    const getVehicleDisplay = (job: JobCard): string => {
        // Debug: Log the job object to see what data we have
        console.log('Job vehicle data:', { vehicle: job.vehicle, vehicleObject: job.vehicleObject, vehicleMake: job.vehicleMake, vehicleModel: job.vehicleModel, part1: job.part1, part1Data: (job as any).part1Data });

        // Try relation first
        if (job.vehicleObject) {
            const display = `${job.vehicleObject.vehicleMake || ''} ${job.vehicleObject.vehicleModel || ''}`.trim();
            if (display) return display;
        }

        // Try legacy fields
        if (job.vehicleMake || job.vehicleModel) {
            const display = `${job.vehicleMake || ''} ${job.vehicleModel || ''}`.trim();
            if (display) return display;
        }

        // Try part1 data (camelCase)
        if (job.part1) {
            const display = `${job.part1.vehicleBrand || ''} ${job.part1.vehicleModel || ''}`.trim();
            if (display) return display;
        }

        // Try part1Data (snake_case from backend)
        const part1Data = (job as any).part1Data;
        if (part1Data) {
            const display = `${part1Data.vehicleBrand || part1Data.vehicle_brand || ''} ${part1Data.vehicleModel || part1Data.vehicle_model || ''}`.trim();
            if (display) return display;
        }

        // Last resort: use vehicle string if it exists
        if (typeof job.vehicle === 'string' && job.vehicle) {
            return job.vehicle;
        }

        // Fallback to just the registration if available
        const reg = job.registration || part1Data?.registrationNumber || part1Data?.registration_number;
        if (reg) return `Vehicle ${reg}`;

        return 'Unknown Vehicle';
    };

    // Helper to get registration number
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

    const getVehicleString = (vehicle: any): string => {
        if (typeof vehicle === 'string') return vehicle;
        if (typeof vehicle === 'object' && vehicle !== null) {
            return `${vehicle.vehicleModel || ''} ${vehicle.registration ? `(${vehicle.registration})` : ''}`.trim();
        }
        return '';
    };

    const getEngineerName = (engineer: any): string => {
        if (!engineer) return 'Unassigned';
        if (typeof engineer === 'string') return engineer;
        if (typeof engineer === 'object' && engineer !== null) {
            return engineer.name || 'Unassigned';
        }
        return 'Unassigned';
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
            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        >
            <div className="flex items-center gap-2">
                {label}
                {sortColumn === column && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
            </div>
        </th>
    );

    if (currentJobs.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Job Cards Found</h3>
                <p className="text-gray-500">No job cards match the current filter criteria.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr><th className="px-4 py-3 bg-gray-50"></th><SortableHeader column="jobCardNumber" label="Job Card #" /><SortableHeader column="status" label="Status" /><SortableHeader column="priority" label="Priority" /><SortableHeader column="customerName" label="Customer" /><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Vehicle</th><SortableHeader column="serviceType" label="Service Type" /><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Engineer</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Estimated</th><SortableHeader column="createdAt" label="Created" /><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Actions</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedJobs.map((job) => {
                            const jobCardId = job.id || job.jobCardNumber;
                            const request = partsRequestsData[jobCardId] || partsRequestsData[job.id] || partsRequestsData[job.jobCardNumber || ""];
                            const hasRequest = request && !request.inventoryManagerAssigned;
                            const isExpanded = expandedRows.has(job.id);

                            return (
                                <React.Fragment key={job.id}>
                                    <tr
                                        className="hover:bg-gray-50 transition cursor-pointer"
                                        onClick={() => !isServiceManager && !isServiceAdvisor && onJobClick(job)}
                                    >
                                        {/* Expand/Collapse */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleRowExpansion(job.id);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 transition"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>

                                        {/* Job Card Number */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                    {job.jobCardNumber || job.id}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                            {hasRequest && (
                                                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
                                                    Parts Pending
                                                </span>
                                            )}
                                            {request?.inventoryManagerAssigned && (
                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium border border-green-200">
                                                    ✓ Parts Assigned
                                                </span>
                                            )}
                                        </td>

                                        {/* Priority */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full ${getPriorityColor(job.priority)}`}></span>
                                                <span className="text-sm text-gray-700">{job.priority}</span>
                                            </div>
                                        </td>

                                        {/* Customer */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {getCustomerName(job)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Car size={14} className="text-gray-400" />
                                                <div className="text-sm">
                                                    <div className="text-gray-900 font-medium">{getVehicleDisplay(job)}</div>
                                                    <div className="text-gray-500 text-xs">{getRegistration(job)}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Service Type */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Wrench size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-700">{job.serviceType}</span>
                                            </div>
                                        </td>

                                        {/* Engineer */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-gray-700">
                                                {getEngineerName(job.assignedEngineer)}
                                            </span>
                                        </td>

                                        {/* Estimated Cost & Time */}
                                        <td className="px-4 py-3 whitespace-nowrap">
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
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-700">{formatDate(job.createdAt)}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {onView && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onView(job.id);
                                                        }}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
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
                                                        className={`p-2 rounded transition ${hasQuotation?.(job.id)
                                                            ? "text-gray-300 cursor-not-allowed"
                                                            : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"}`}
                                                        title={hasQuotation?.(job.id) ? "Quotation Already Created" : "Create Quotation"}
                                                        disabled={hasQuotation?.(job.id)}
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}
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
                                                {isServiceAdvisor && job.status === "CREATED" && onPassToManager && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!job.passedToManager) {
                                                                onPassToManager(job.id);
                                                            }
                                                        }}
                                                        className={`p-2 rounded transition ${job.passedToManager
                                                            ? "text-gray-300 cursor-not-allowed"
                                                            : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"}`}
                                                        title={job.passedToManager ? "Already Sent to Manager" : "Pass to Manager"}
                                                        disabled={job.passedToManager}
                                                    >
                                                        <ArrowRight size={16} />
                                                    </button>
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
                                                {isServiceManager && job.status === "CREATED" && onAssignEngineer && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAssignEngineer(job.id);
                                                        }}
                                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition"
                                                        title="Assign Engineer"
                                                    >
                                                        <UserPlus size={16} />
                                                    </button>
                                                )}
                                                {isServiceManager && getNextStatus && getNextStatus(job.status).length > 0 && onUpdateStatus && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateStatus(job.id, job.status);
                                                        }}
                                                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition"
                                                        title="Update Status"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-50"><td colSpan={11} className="px-4 py-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200"><div className="lg:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Description</label><p className="mt-1 text-sm text-gray-700">{job.description || 'No description provided'}</p></div><div><label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><MapPin size={12} />Location</label><p className="mt-1 text-sm text-gray-700">{job.location === 'DOORSTEP' ? 'Home Service' : 'Station'}</p></div>{job.customerType && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Customer Type</label><p className="mt-1 text-sm text-gray-700">{job.customerType}</p></div>)}<div><label className="text-xs font-semibold text-gray-500 uppercase">Vehicle Details</label><p className="mt-1 text-sm text-gray-700">{job.vehicleMake} {job.vehicleModel}</p></div>{job.serviceCenterName && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Service Center</label><p className="mt-1 text-sm text-gray-700">{job.serviceCenterName}</p></div>)}{job.customerArrivalTimestamp && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Customer Arrival</label><p className="mt-1 text-sm text-gray-700">{formatDate(job.customerArrivalTimestamp)}</p></div>)}{job.parts && job.parts.length > 0 && (<div><label className="text-xs font-semibold text-gray-500 uppercase">Parts</label><p className="mt-1 text-sm text-gray-700">{job.parts.length} parts requested</p></div>)}<div className="lg:col-span-3"><label className="text-xs font-semibold text-gray-500 uppercase">Job Card ID</label><p className="mt-1 text-xs text-gray-500 font-mono">{job.id}</p></div></div></td></tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{sortedJobs.length}</span> job cards
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span>Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
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
