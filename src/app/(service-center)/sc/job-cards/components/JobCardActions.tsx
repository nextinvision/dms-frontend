import * as React from 'react';
import { JobCard, JobCardStatus } from '@/shared/types';

interface JobCardActionsProps {
    isServiceAdvisor: boolean;
    isServiceManager: boolean;
    selectedJob: JobCard | null;
    technicianApproved: boolean;
    setTechnicianApproved: (val: boolean) => void;
    partsApproved: boolean;
    setPartsApproved: (val: boolean) => void;
    handleSubmitToManager: () => void;
    handleManagerQuoteAction: () => void;
    handleManagerReview: (jobId: string, status: "APPROVED" | "REJECTED", notes?: string) => void;
    handleCreateInvoice: () => void;
    handleSendInvoiceToCustomer: () => void;
    visibleJobCards: JobCard[];
}

const JobCardActions: React.FC<JobCardActionsProps> = ({
    isServiceAdvisor,
    isServiceManager,
    selectedJob,
    technicianApproved,
    setTechnicianApproved,
    partsApproved,
    setPartsApproved,
    handleSubmitToManager,
    handleManagerQuoteAction,
    handleManagerReview,
    handleCreateInvoice,
    handleSendInvoiceToCustomer,
    visibleJobCards,
}) => {
    return (
        <>
            {/* Service Advisor: Submit to Manager Panel */}
            {isServiceAdvisor && selectedJob && selectedJob.status === "CREATED" && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-blue-800">Submit Job Card to Manager</p>
                            <p className="text-xs text-blue-600 mt-1">
                                {selectedJob.passedToManager
                                    ? "This job card has already been submitted to the manager for review."
                                    : "Review the job card details and required parts, then submit to manager for approval and technician assignment."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmitToManager}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${selectedJob.passedToManager
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-blue-600 text-white shadow-md hover:bg-blue-700"}`}
                            disabled={selectedJob.passedToManager}
                        >
                            {selectedJob.passedToManager ? "Already Sent to Manager" : "Submit to Manager"}
                        </button>
                    </div>
                </div>
            )}

            {/* Service Manager: Job Card Approval Panel */}
            {isServiceManager && selectedJob && selectedJob.passedToManager && (!selectedJob.managerReviewStatus || selectedJob.managerReviewStatus === 'PENDING') && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-white rounded-xl p-4 shadow-sm border border-purple-100">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-800">Job Card Warranty Approval Required</p>
                            <p className="text-xs text-purple-600 mt-1 mb-2">
                                This job card contains warranty tags and requires your approval before proceeding.
                            </p>

                            {/* List Warranty Items */}
                            {selectedJob.part2 && selectedJob.part2.some(item => item.partWarrantyTag) && (
                                <div className="mt-2 bg-white/50 p-2 rounded border border-purple-100">
                                    <p className="text-xs font-semibold text-purple-800 mb-1">Warranty Items:</p>
                                    <ul className="list-disc list-inside text-xs text-purple-700 space-y-1">
                                        {selectedJob.part2
                                            .filter(item => item.partWarrantyTag)
                                            .map((item, index) => (
                                                <li key={index}>
                                                    <span className="font-medium">{item.partName}</span>
                                                    {item.partCode && <span className="text-purple-500"> ({item.partCode})</span>}
                                                    <span className="text-gray-500"> - Qty: {item.qty}</span>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2 lg:mt-0">
                            <button
                                type="button"
                                onClick={() => handleManagerReview(selectedJob.id, "REJECTED", "Rejected by Manager")}
                                className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-100 text-red-700 hover:bg-red-200 h-fit"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={() => handleManagerReview(selectedJob.id, "APPROVED")}
                                className="px-4 py-2 rounded-lg font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700 shadow-md h-fit"
                            >
                                Approve Job Card
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Manager: Manager-Driven Quotation & Monitoring Panel */}
      
            {/* Service Advisor: Send Invoice to Customer */}
            {isServiceAdvisor && selectedJob && selectedJob.invoiceNumber && !selectedJob.invoiceSentToCustomer && (
                <div className="mb-4 bg-gradient-to-r from-yellow-50 to-white rounded-xl p-4 shadow-sm border border-yellow-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Send Invoice to Customer</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Invoice {selectedJob.invoiceNumber} is ready. Send to customer at vehicle receiving time.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSendInvoiceToCustomer}
                            className="px-4 py-2 rounded-lg font-semibold text-sm transition bg-yellow-600 text-white shadow-md hover:bg-yellow-700"
                        >
                            Send Invoice to Customer
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default JobCardActions;
