import * as React from 'react';
import { X, Package, User, CheckCircle, XCircle, ShieldCheck, FileText } from 'lucide-react';
import { JobCard, JobCardStatus, Priority } from '@/shared/types';
import { getVehicleDisplayString, getAssignedEngineerName, getAllJobCardParts } from "@/features/job-cards/utils/job-card-helpers";
import { hasActiveQuotation } from "@/shared/utils/quotation.utils";

interface JobCardDetailsModalProps {
    open: boolean;
    onClose: () => void;
    job: JobCard | null;
    getStatusColor: (status: JobCardStatus) => string;
    getPriorityColor: (priority: Priority) => string;
    getNextStatus: (status: JobCardStatus) => JobCardStatus[];
    onAssignEngineer: (jobId: string) => void;
    onUpdateStatus: (jobId: string, initialStatus: JobCardStatus) => void;
    onApprove?: (jobId: string) => void;
    onReject?: (jobId: string) => void;
    onSendToManager?: (jobId: string) => void;
    onCreateQuotation?: (job: JobCard) => void;
    onCreateInvoice?: (job: JobCard) => void;
}

const JobCardDetailsModal: React.FC<JobCardDetailsModalProps> = ({
    open,
    onClose,
    job,
    getStatusColor,
    getPriorityColor,
    getNextStatus,
    onAssignEngineer,
    onUpdateStatus,
    onApprove,
    onReject,
    onSendToManager,
    onCreateQuotation,
    onCreateInvoice,
}) => {
    if (!open || !job) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto p-4 md:p-6 z-[101]">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Job Card Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Status and Priority */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base">
                            {job.jobCardNumber || job.id}
                        </span>
                        <span
                            className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium border ${getStatusColor(
                                job.status
                            )}`}
                        >
                            {job.status.replace(/_/g, ' ')}
                        </span>
                        <span
                            className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white ${getPriorityColor(
                                job.priority
                            )}`}
                        >
                            {job.priority} Priority
                        </span>
                        {job.passedToManager && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium border border-purple-200">
                                Sent to Manager
                            </span>
                        )}
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-blue-50 p-3 md:p-4 rounded-xl">
                            <h3 className="font-semibold text-blue-800 mb-1 md:mb-2 text-sm md:text-base">Customer Information</h3>
                            <p className="text-xs md:text-sm text-gray-700 break-words">{job.customerName}</p>
                        </div>
                        <div className="bg-green-50 p-3 md:p-4 rounded-xl">
                            <h3 className="font-semibold text-green-800 mb-1 md:mb-2 text-sm md:text-base">Vehicle Information</h3>
                            <p className="text-xs md:text-sm text-gray-700 break-words">
                                {getVehicleDisplayString(job.vehicle)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 break-words">{job.registration}</p>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Service Details</h3>
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-700 mb-1 md:mb-2 break-words">
                                <strong>Type:</strong> {job.serviceType}
                            </p>
                            <p className="text-xs md:text-sm text-gray-700 break-words">
                                <strong>Description:</strong> {job.description}
                            </p>
                            {job.location && (
                                <p className="text-xs md:text-sm text-gray-700 mt-2 break-words">
                                    <strong>Location:</strong> {job.location === 'DOORSTEP' ? 'Home Service' : 'Station'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Parts & Estimates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Required Parts</h3>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                                {(() => {
                                    // Use centralized utility to get all parts (existing + requested)
                                    const allParts = getAllJobCardParts(job);
                                    const partItems = allParts.filter((item: any) => 
                                        item?.itemType === 'part' || (item && !item.itemType && item.partName)
                                    );
                                    
                                    // Fallback to legacy parts field for backward compatibility
                                    const legacyParts = job.parts || [];
                                    
                                    if (partItems.length > 0) {
                                        return (
                                            <ul className="space-y-1">
                                                {partItems.map((item: any, idx: number) => (
                                                    <li key={idx} className="text-xs md:text-sm text-gray-700 flex items-center gap-1 md:gap-2 break-words">
                                                        <Package size={12} className="text-gray-400 flex-shrink-0" />
                                                        <span className="flex items-center gap-2 flex-wrap">
                                                            <span>
                                                                {item.partName || item.part}
                                                                {item.qty && ` (Qty: ${item.qty})`}
                                                            </span>
                                                            {item.isWarranty && (
                                                                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                                                    Warranty
                                                                </span>
                                                            )}
                                                            {/* Show source/status badge */}
                                                            {item.source === 'requested' && item.requestStatus && (
                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                                    item.requestStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    item.requestStatus === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                                    item.requestStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {item.requestStatus === 'PENDING' ? 'Requested' :
                                                                     item.requestStatus === 'APPROVED' ? 'Approved' :
                                                                     item.requestStatus === 'COMPLETED' ? 'Assigned' :
                                                                     item.requestStatus}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        );
                                    } else if (legacyParts.length > 0) {
                                        return (
                                    <ul className="space-y-1">
                                                {legacyParts.map((part: string, idx: number) => (
                                            <li key={idx} className="text-xs md:text-sm text-gray-700 flex items-center gap-1 md:gap-2 break-words">
                                                <Package size={12} className="text-gray-400 flex-shrink-0" />
                                                {part}
                                            </li>
                                        ))}
                                    </ul>
                                        );
                                    }
                                    return <p className="text-xs md:text-sm text-gray-500">No parts required</p>;
                                })()}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Estimates</h3>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-1 md:space-y-2">
                                <p className="text-xs md:text-sm text-gray-700 break-words">
                                    <strong>Cost:</strong> {job.estimatedCost}
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 break-words">
                                    <strong>Time:</strong> {job.estimatedTime}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Engineer Assignment */}
                    {job.assignedEngineer && (
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Assigned Engineer</h3>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                                <p className="text-xs md:text-sm text-gray-700 flex items-center gap-1 md:gap-2 break-words">
                                    <User size={14} className="text-gray-400 flex-shrink-0" />
                                    {getAssignedEngineerName(job.assignedEngineer)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-gray-200 transition text-sm md:text-base"
                        >
                            Close
                        </button>
                        {job.status === "CREATED" && !job.assignedEngineer && (
                            <button
                                onClick={() => onAssignEngineer(job.id)}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:opacity-90 transition text-sm md:text-base"
                            >
                                Assign Engineer
                            </button>
                        )}
                        {!job.passedToManager && (job.status === "CREATED" || job.status === "AWAITING_QUOTATION_APPROVAL") && onSendToManager && (
                            <button
                                onClick={() => onSendToManager(job.id)}
                                className="flex-1 bg-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-purple-700 transition text-sm md:text-base flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={18} />
                                Send to Manager
                            </button>
                        )}
                        {job.passedToManager && (job.status === "CREATED" || job.status === "AWAITING_QUOTATION_APPROVAL") && onApprove && (
                            <button
                                onClick={() => onApprove(job.id)}
                                className="flex-1 bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-green-700 transition text-sm md:text-base flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Approve
                            </button>
                        )}
                        {job.passedToManager && (job.status === "CREATED" || job.status === "AWAITING_QUOTATION_APPROVAL") && onReject && (
                            <button
                                onClick={() => onReject(job.id)}
                                className="flex-1 bg-red-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-red-700 transition text-sm md:text-base flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} />
                                Reject
                            </button>
                        )}
                        {getNextStatus(job.status).length > 0 && (
                            <button
                                onClick={() => onUpdateStatus(job.id, job.status)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:opacity-90 transition text-sm md:text-base"
                            >
                                Update Status
                            </button>
                        )}
                        {job.managerReviewStatus === "APPROVED" && !hasActiveQuotation(job) && onCreateQuotation && (
                            <button
                                onClick={() => onCreateQuotation(job)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:opacity-90 transition text-sm md:text-base flex items-center justify-center gap-2"
                            >
                                <FileText size={18} />
                                Create Quotation
                            </button>
                        )}
                        {job.status === "COMPLETED" && onCreateInvoice && (
                            <button
                                onClick={() => onCreateInvoice(job)}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:opacity-90 transition text-sm md:text-base flex items-center justify-center gap-2"
                            >
                                <FileText size={18} />
                                Generate Invoice
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobCardDetailsModal;
