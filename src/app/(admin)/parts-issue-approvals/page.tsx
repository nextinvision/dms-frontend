"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { adminApprovalService } from "@/features/inventory/services/adminApproval.service";
import { useRole } from "@/shared/hooks";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Package, Building, Clock, AlertCircle, RefreshCw } from "lucide-react";
import type { PartsIssue } from "@/shared/types/central-inventory.types";

export default function PartsIssueApprovalsPage() {
  const { userInfo, userRole } = useRole();
  const { showSuccess, showError } = useToast();
  const isAdmin = userRole === "admin";
  const [pendingRequests, setPendingRequests] = useState<PartsIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use refs to track state without causing re-renders in useEffect
  const isLoadingRef = useRef(false);
  const isProcessingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Shared data fetching logic
  const fetchPendingRequestsData = useCallback(async () => {
    const requests = await adminApprovalService.getPendingApprovals();
    console.log("Admin page - Fetched pending requests:", requests.length, requests);
    setPendingRequests(requests);
  }, []);

  // Main fetch with loading state
  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      isLoadingRef.current = true;
      await fetchPendingRequestsData();
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      showError("Failed to fetch pending requests. Please refresh the page.");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchPendingRequestsData, showError]);

  // Silent fetch for polling (doesn't show loading state)
  const fetchPendingRequestsSilently = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchPendingRequestsData();
    } catch (error) {
      // Silently fail during polling - don't show error to user
      console.error("Failed to refresh requests (silent):", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPendingRequestsData]);

  useEffect(() => {
    if (!isAdmin) return;
    
    // Initial fetch
    fetchPendingRequests();
    
    // Auto-refresh polling: Check for updates every 5 seconds
    const pollInterval = setInterval(() => {
      // Only poll if page is visible and not currently loading/processing
      // Use refs instead of state to avoid dependency issues
      if (document.visibilityState === "visible" && !isLoadingRef.current && !isProcessingRef.current) {
        fetchPendingRequestsSilently();
      }
    }, 5000);

    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isLoadingRef.current && !isProcessingRef.current) {
        fetchPendingRequestsSilently();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdmin, fetchPendingRequests, fetchPendingRequestsSilently]);

  const handleApprove = async (id: string) => {
    if (!isAdmin) {
      showError("Only admin can approve requests.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Optimistically remove from list immediately
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setSelectedRequest(null);
      setNotes("");
      
      const approvedIssue = await adminApprovalService.approvePartsIssue(
        id,
        userInfo?.name || "Admin",
        notes || undefined
      );
      
      console.log('Approval result:', {
        id,
        status: approvedIssue.status,
        adminApproved: approvedIssue.adminApproved
      });
      
      // Silently refresh to ensure data is in sync
      await fetchPendingRequestsSilently();
      
      showSuccess("Parts issue request approved successfully! Central inventory manager can now issue the parts.");
    } catch (error) {
      console.error("Failed to approve:", error);
      // Re-fetch on error to restore the list
      await fetchPendingRequests();
      showError(error instanceof Error ? error.message : "Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!isAdmin) {
      showError("Only admin can reject requests.");
      return;
    }

    if (!rejectionReason.trim()) {
      showError("Please provide a reason for rejection.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Optimistically remove from list immediately
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setSelectedRequest(null);
      setRejectionReason("");
      
      await adminApprovalService.rejectPartsIssue(
        id,
        userInfo?.name || "Admin",
        rejectionReason
      );
      
      // Silently refresh to ensure data is in sync
      await fetchPendingRequestsSilently();
      
      showSuccess("Parts issue request rejected.");
    } catch (error) {
      console.error("Failed to reject:", error);
      // Re-fetch on error to restore the list
      await fetchPendingRequests();
      showError(error instanceof Error ? error.message : "Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRequestCard = (request: PartsIssue) => {
    const isSelected = selectedRequest === request.id;
    // Show approve button for PENDING_APPROVAL or CIM_APPROVED issues that haven't been admin approved/rejected
    const isPending = (request.status === "pending_admin_approval" || request.status === "cim_approved") 
      && !request.adminApproved 
      && !request.adminRejected
      && request.status !== "admin_approved";

    return (
      <Card
        key={request.id}
        className={`border-l-4 ${request.adminApproved
            ? "border-l-green-500"
            : request.adminRejected
              ? "border-l-red-500"
              : "border-l-yellow-500"
          }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Issue Number: {request.issueNumber}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Service Center: {request.serviceCenterName}
              </p>
              {request.issuedBy && (
                <p className="text-xs text-gray-500 mt-1">
                  Requested by: {request.issuedBy} on{" "}
                  {request.issuedAt ? new Date(request.issuedAt).toLocaleString() : "N/A"}
                </p>
              )}
              {request.sentToAdminAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Sent to admin: {new Date(request.sentToAdminAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              {request.adminApproved ? (
                <Badge variant="success">Approved</Badge>
              ) : request.adminRejected ? (
                <Badge variant="danger">Rejected</Badge>
              ) : (
                <Badge variant="warning">Pending Approval</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Approval Status */}
          <div className="mb-4 flex gap-3">
            <button
              disabled
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${request.adminApproved
                  ? "bg-green-500 text-white"
                  : request.adminRejected
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
            >
              {request.adminApproved ? (
                <CheckCircle size={16} />
              ) : request.adminRejected ? (
                <XCircle size={16} />
              ) : (
                <Clock size={16} />
              )}
              Admin {request.adminApproved ? "✓ Approved" : request.adminRejected ? "✗ Rejected" : "Pending"}
            </button>
          </div>

          {/* Approval Details */}
          {request.adminApproved && request.adminApprovedBy && (
            <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
              Approved by {request.adminApprovedBy} on{" "}
              {request.adminApprovedAt
                ? new Date(request.adminApprovedAt).toLocaleString()
                : "N/A"}
            </div>
          )}

          {request.adminRejected && request.adminRejectedBy && (
            <div className="mb-3 p-2 bg-red-50 rounded text-xs text-red-700">
              Rejected by {request.adminRejectedBy} on{" "}
              {request.adminRejectedAt
                ? new Date(request.adminRejectedAt).toLocaleString()
                : "N/A"}
              {request.adminRejectionReason && (
                <span className="block mt-1 font-semibold">
                  Reason: {request.adminRejectionReason}
                </span>
              )}
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Package size={16} />
              Parts to Issue:
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {request.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.partName}</p>
                    <p className="text-sm text-gray-600">
                      HSN Code: {item.hsnCode} | Part Number: {item.partNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">Qty: {item.quantity}</p>
                    <p className="text-sm text-gray-600">₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {request.purchaseOrderId && (
            <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
              <strong>Purchase Order:</strong> {request.purchaseOrderId}
            </div>
          )}

          {request.transportDetails && (
            <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
              <strong>Transport Details:</strong>
              {request.transportDetails.transporter && (
                <p>Transporter: {request.transportDetails.transporter}</p>
              )}
              {request.transportDetails.trackingNumber && (
                <p>Tracking: {request.transportDetails.trackingNumber}</p>
              )}
              {request.transportDetails.expectedDelivery && (
                <p>
                  Expected Delivery:{" "}
                  {new Date(request.transportDetails.expectedDelivery).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {request.notes && (
            <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
              <strong>Notes:</strong> {request.notes}
            </div>
          )}

          <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-lg font-bold text-indigo-600">
                ₹{request.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {isSelected && isPending && isAdmin && (
            <div className="border-t pt-4 mt-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add approval notes (optional)..."
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve & Issue Parts
                </Button>
                <Button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing || !rejectionReason.trim()}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle size={16} className="mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    setNotes("");
                    setRejectionReason("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!isSelected && isPending && isAdmin && (
            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedRequest(request.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Review & Approve
              </Button>
            </div>
          )}

          {/* Show message if already approved */}
          {request.adminApproved && request.status === "admin_approved" && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Already Approved by Admin
                    </p>
                    <p className="text-xs text-green-700">
                      This request has been approved. Central inventory manager can now dispatch the parts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  if (!isAdmin) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen pt-24 px-8 pb-10">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen pt-24 px-8 pb-10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600">Parts Issue Approvals</h1>
            <p className="text-gray-500 mt-1">
              Review and approve parts issue requests from central inventory manager
              {isRefreshing && (
                <span className="ml-2 text-xs text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Auto-refreshing...
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={fetchPendingRequests}
            disabled={isLoading || isProcessing}
            variant="outline"
            className="flex items-center gap-2"
            title="Refresh requests"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Pending Requests Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-yellow-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Approval Requests ({pendingRequests.length})
            </h2>
          </div>
          {pendingRequests.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                  <p>No pending approval requests</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => renderRequestCard(request))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

