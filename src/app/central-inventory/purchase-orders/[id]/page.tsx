"use client";
import { useState, useEffect } from "react";
import React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCheck,
  Package,
  Building,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import { useRole } from "@/shared/hooks/useRole";
import { validateItemsAgainstStock } from "@/shared/utils/part-matching.utils";
import { calculatePOItemIssuedQuantities, calculateRemainingQuantity } from "@/shared/utils/po-fulfillment.utils";
import { findMatchingPOItem } from "@/shared/utils/po-item-matching.utils";
import type { PurchaseOrder } from "@/shared/types/central-inventory.types";

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showSuccess, showError, showWarning } = useToast();
  const { userRole } = useRole();
  const poId = params.id as string;
  const issueRemaining = searchParams.get('issueRemaining') === 'true';
  const isAdmin = userRole === 'admin';
  const isCIM = userRole === 'central_inventory_manager';
  const canApprovePO = isAdmin || isCIM; // Both admin and CIM can approve POs

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [approvedItems, setApprovedItems] = useState<Array<{ itemId: string; approvedQty: number }>>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [partDetails, setPartDetails] = useState<Record<string, any>>({});
  const [itemIssuedQty, setItemIssuedQty] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        const po = await centralInventoryRepository.getPurchaseOrderById(poId);
        if (!po) {
          router.push("/central-inventory/purchase-orders");
          return;
        }
        setPurchaseOrder(po);
        
        // Calculate issued quantities for each item
        const allPartsIssues = await centralInventoryRepository.getAllPartsIssues();
        const relatedIssues = allPartsIssues.filter(issue => issue.purchaseOrderId === poId);
        
        const issuedQtyMap = calculatePOItemIssuedQuantities(po.items, relatedIssues);
        setItemIssuedQty(issuedQtyMap);
        
        // If issueRemaining is true, automatically trigger issue parts flow
        if (issueRemaining && isCIM && po.status === "approved") {
          // Trigger the issue parts button click after a short delay
          setTimeout(() => {
            const issueButton = document.querySelector('[data-issue-parts-button]') as HTMLButtonElement;
            if (issueButton && !issueButton.disabled) {
              issueButton.click();
            }
          }, 500);
        }
      } catch (error) {
        console.error("Failed to fetch purchase order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (poId) {
      fetchPurchaseOrder();
    }
  }, [poId, router, issueRemaining, isCIM]);

  const handleApprove = async () => {
    if (!purchaseOrder || !canApprovePO) return;

    setShowApproveModal(false);
    setIsProcessing(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || '{"name": "User"}');
      const approvedPO = await centralInventoryRepository.approvePurchaseOrder(
        poId,
        userInfo.name || "User"
      );
      setPurchaseOrder(approvedPO);
      if (isCIM) {
        showSuccess("Purchase order approved successfully! Redirecting to issue page...");
        // Redirect to issue page with purchase order data
        setTimeout(() => {
          const itemsParam = encodeURIComponent(JSON.stringify(
            purchaseOrder.items.map(item => ({
              partId: item.partId,
              partName: item.partName,
              quantity: item.requestedQty || item.quantity || 0,
              unitPrice: item.unitPrice,
            }))
          ));
          router.push(`/central-inventory/stock/issue/${purchaseOrder.serviceCenterId}?poId=${poId}&items=${itemsParam}`);
        }, 1500);
      } else {
        showSuccess("Purchase order approved successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to approve purchase order:", error);
      showError("Failed to approve purchase order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleIssue = async () => {
    if (!purchaseOrder || !isCIM) return;

    if (approvedItems.length === 0) {
      showWarning("Please approve at least one item to issue");
      return;
    }

    setShowIssueModal(false);
    setIsProcessing(true);
    try {
      const partsIssue = await centralInventoryRepository.issuePurchaseOrder(poId, approvedItems);
      showSuccess(`Parts Issue created successfully! Issue Number: ${partsIssue.issueNumber}. This Parts Issue is now pending admin approval before parts can be dispatched.`);
      
      // Navigate to parts issue detail page
      setTimeout(() => {
        router.push(`/central-inventory/parts-issue-requests`);
      }, 2000);
    } catch (error) {
      console.error("Failed to issue parts:", error);
      showError("Failed to create parts issue. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!purchaseOrder || !rejectionReason.trim()) {
      showWarning("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      // Note: Backend doesn't have reject endpoint yet, so we'll cancel it
      // For now, just show a message
      showError("Reject functionality not yet implemented in backend");
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to reject purchase order:", error);
      showError("Failed to reject purchase order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    const variants: Record<PurchaseOrder["status"], { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      partially_fulfilled: { color: "bg-blue-100 text-blue-800", label: "Partially Fulfilled" },
      fulfilled: { color: "bg-gray-100 text-gray-800", label: "Fulfilled" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: PurchaseOrder["priority"]) => {
    const variants: Record<PurchaseOrder["priority"], { color: string; label: string }> = {
      low: { color: "bg-gray-100 text-gray-800", label: "Low" },
      normal: { color: "bg-blue-100 text-blue-800", label: "Normal" },
      high: { color: "bg-orange-100 text-orange-800", label: "High" },
      urgent: { color: "bg-red-100 text-red-800", label: "Urgent" },
    };
    const variant = variants[priority] || variants.normal;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading purchase order...</div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return null;
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Purchase Orders</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">{purchaseOrder.poNumber}</h1>
              <div className="flex items-center gap-2">
                {getStatusBadge(purchaseOrder.status)}
                {getPriorityBadge(purchaseOrder.priority)}
              </div>
            </div>
            {/* CIM and Admin can approve PENDING_APPROVAL POs */}
            {purchaseOrder.status === "pending" && canApprovePO && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowApproveModal(true)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Purchase Order
                </Button>
              </div>
            )}
            {/* CIM can issue parts after approving PO - redirects to issue page */}
            {purchaseOrder.status === "approved" && isCIM && (
              <div className="flex gap-3">
                <Button
                  data-issue-parts-button
                  onClick={async () => {
                    try {
                      // Fetch all central inventory stock to validate parts
                      const allStock = await centralInventoryRepository.getAllStock();
                      
                      // Use the already-calculated itemIssuedQty from state, or recalculate if needed
                      let currentIssuedQty = itemIssuedQty;
                      if (currentIssuedQty.size === 0) {
                        // Recalculate if state is empty
                        const allPartsIssues = await centralInventoryRepository.getAllPartsIssues();
                        const relatedIssues = allPartsIssues.filter(issue => issue.purchaseOrderId === poId);
                        // Use utility function to calculate issued quantities
                        const calculatedIssuedQty = calculatePOItemIssuedQuantities(purchaseOrder.items, relatedIssues);
                        currentIssuedQty = calculatedIssuedQty;
                      }
                      
                      // Calculate remaining quantities for each PO item using the issued quantities
                      const itemsWithRemaining = purchaseOrder.items.map(item => {
                        const requestedQty = Number(item.requestedQty || item.quantity || 0);
                        const issuedQty = Number(currentIssuedQty.get(item.id) || 0);
                        const remainingQty = calculateRemainingQuantity(requestedQty, issuedQty);
                        
                        return {
                          partId: item.partId,
                          partName: item.partName,
                          partNumber: item.partNumber,
                          quantity: remainingQty, // Use remaining quantity, not full requested quantity
                          unitPrice: item.unitPrice,
                          requestedQty: requestedQty,
                          issuedQty: issuedQty,
                        };
                      }).filter(item => item.quantity > 0); // Only include items with remaining quantity
                      
                      if (itemsWithRemaining.length === 0) {
                        showError("All parts from this purchase order have already been issued.");
                        return;
                      }
                      
                      // Validate items using utility function
                      const { validItems, invalidItems } = validateItemsAgainstStock(
                        itemsWithRemaining,
                        allStock
                      );
                      
                      // If all items are valid, redirect with autofilled data (only remaining quantities)
                      if (invalidItems.length === 0) {
                        const itemsParam = encodeURIComponent(JSON.stringify(
                          validItems.map(item => ({
                            partId: item.matchedPartId,
                            partName: item.partName,
                            partNumber: item.partNumber,
                            quantity: item.quantity, // This is already the remaining quantity
                            unitPrice: item.unitPrice,
                          }))
                        ));
                        router.push(`/central-inventory/stock/issue/${purchaseOrder.serviceCenterId}?poId=${poId}&items=${itemsParam}`);
                      } else {
                        // Some parts don't exist - redirect without autofill
                        const invalidPartNames = invalidItems.map(i => 
                          `${i.partName || 'Unknown'}${i.partNumber ? ` (${i.partNumber})` : ''}`
                        ).join(', ');
                        
                        if (confirm(
                          `The following parts are not found in Central Inventory (both part number and part name must match):\n\n${invalidPartNames}\n\n` +
                          `You will be redirected to the issue page where you can manually select the correct parts.\n\n` +
                          `Continue?`
                        )) {
                          // Redirect without items param - user must select manually
                          router.push(`/central-inventory/stock/issue/${purchaseOrder.serviceCenterId}?poId=${poId}`);
                        }
                      }
                    } catch (error) {
                      console.error("Error validating parts:", error);
                      showError("Failed to validate parts. Redirecting to issue page without autofill.");
                      // Fallback: redirect without autofill
                      router.push(`/central-inventory/stock/issue/${purchaseOrder.serviceCenterId}?poId=${poId}`);
                    }
                  }}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Issue Parts
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Building className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Service Center</p>
                      <p className="font-semibold text-lg text-gray-900 mb-2">
                        {purchaseOrder.serviceCenterName}
                        {purchaseOrder.serviceCenterCode && (
                          <span className="text-blue-600 font-normal ml-2">({purchaseOrder.serviceCenterCode})</span>
                        )}
                      </p>
                      {(purchaseOrder.serviceCenterAddress || purchaseOrder.serviceCenterCity || purchaseOrder.serviceCenterState) && (
                        <div className="text-sm text-gray-700 space-y-1 mb-2">
                          {purchaseOrder.serviceCenterAddress && (
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">📍</span>
                              <span>{purchaseOrder.serviceCenterAddress}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500">🏙️</span>
                            <span>
                              {[purchaseOrder.serviceCenterCity, purchaseOrder.serviceCenterState, purchaseOrder.serviceCenterPinCode]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        </div>
                      )}
                      {(purchaseOrder.serviceCenterPhone || purchaseOrder.serviceCenterEmail) && (
                        <div className="text-sm text-gray-600 space-x-4 mt-2">
                          {purchaseOrder.serviceCenterPhone && (
                            <span className="flex items-center gap-1">
                              <span>📞</span>
                              <span>{purchaseOrder.serviceCenterPhone}</span>
                            </span>
                          )}
                          {purchaseOrder.serviceCenterEmail && (
                            <span className="flex items-center gap-1">
                              <span>✉️</span>
                              <span>{purchaseOrder.serviceCenterEmail}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Requested By</p>
                      <p className="font-medium">{purchaseOrder.requestedBy}</p>
                      {purchaseOrder.requestedByEmail && (
                        <p className="text-sm text-gray-400">{purchaseOrder.requestedByEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Requested At</p>
                      <p className="font-medium">
                        {new Date(purchaseOrder.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {purchaseOrder.approvedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Approved At</p>
                        <p className="font-medium">
                          {new Date(purchaseOrder.approvedAt).toLocaleString()}
                        </p>
                        {purchaseOrder.approvedBy && (
                          <p className="text-sm text-gray-400">by {purchaseOrder.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {purchaseOrder.rejectedAt && (
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Rejected At</p>
                        <p className="font-medium">
                          {new Date(purchaseOrder.rejectedAt).toLocaleString()}
                        </p>
                        {purchaseOrder.rejectedBy && (
                          <p className="text-sm text-gray-400">by {purchaseOrder.rejectedBy}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {purchaseOrder.jobCardId && (
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Job Card</p>
                        <p className="font-medium">{purchaseOrder.jobCardId}</p>
                      </div>
                    </div>
                  )}
                  {purchaseOrder.vehicleNumber && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Vehicle Number</p>
                        <p className="font-medium">{purchaseOrder.vehicleNumber}</p>
                        {purchaseOrder.customerName && (
                          <p className="text-sm text-gray-400">{purchaseOrder.customerName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {purchaseOrder.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700">{purchaseOrder.notes}</p>
                  </div>
                )}
                {purchaseOrder.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-1">Rejection Reason</p>
                    <p className="text-red-700">{purchaseOrder.rejectionReason}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-800">Order Items</h2>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Part Name
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          HSN Code
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Requested Qty
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Approved Qty
                        </th>
                        {purchaseOrder.status === "approved" && (
                          <>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              Issued Qty
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-orange-700">
                              Remaining Qty
                            </th>
                          </>
                        )}
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Unit Price
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Total
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.items.map((item) => {
                        const isExpanded = expandedItems.has(item.id);
                        const requestedQty = item.requestedQty || item.quantity || 0;
                        const issuedQty = itemIssuedQty.get(item.id) || 0;
                        const remainingQty = calculateRemainingQuantity(requestedQty, issuedQty);
                        const colSpan = purchaseOrder.status === "approved" ? 9 : 7;
                        
                        return (
                          <React.Fragment key={item.id}>
                            <tr 
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                const newExpanded = new Set(expandedItems);
                                if (isExpanded) {
                                  newExpanded.delete(item.id);
                                } else {
                                  newExpanded.add(item.id);
                                }
                                setExpandedItems(newExpanded);
                              }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.partName}</p>
                                    <p className="text-sm text-gray-500">Part #: {item.partNumber || 'N/A'}</p>
                                    {item.partCode && (
                                      <p className="text-sm text-gray-400">Code: {item.partCode}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{item.hsnCode || 'N/A'}</td>
                              <td className="py-3 px-4 text-right font-medium">{requestedQty}</td>
                              <td className="py-3 px-4 text-right">
                                {item.approvedQty !== undefined ? (
                                  <span className="font-medium">{item.approvedQty}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              {purchaseOrder.status === "approved" && (
                                <>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`font-medium ${issuedQty > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {issuedQty > 0 ? issuedQty : '-'}
                                    </span>
                                    {issuedQty > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">issued before</p>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`font-medium ${remainingQty > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                      {remainingQty > 0 ? remainingQty : '-'}
                                    </span>
                                    {remainingQty > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">to fulfill</p>
                                    )}
                                  </td>
                                </>
                              )}
                              <td className="py-3 px-4 text-right">₹{item.unitPrice.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-medium">
                                ₹{(item.totalPrice || (item.unitPrice * requestedQty)).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  className={
                                    item.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : item.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${item.id}-details`} className="bg-blue-50">
                                <td colSpan={colSpan} className="py-4 px-4">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500 font-medium mb-1">Part Information</p>
                                      <p className="text-gray-700"><span className="font-medium">Name:</span> {item.partName}</p>
                                      <p className="text-gray-700"><span className="font-medium">Part Number:</span> {item.partNumber || 'N/A'}</p>
                                      {item.oemPartNumber && (
                                        <p className="text-gray-700"><span className="font-medium">OEM Part Number:</span> {item.oemPartNumber}</p>
                                      )}
                                      <p className="text-gray-700"><span className="font-medium">Category:</span> {item.category || 'N/A'}</p>
                                      <p className="text-gray-700"><span className="font-medium">HSN Code:</span> {item.hsnCode || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 font-medium mb-1">Part Details</p>
                                      {item.brandName && (
                                        <p className="text-gray-700"><span className="font-medium">Brand:</span> {item.brandName}</p>
                                      )}
                                      {item.variant && (
                                        <p className="text-gray-700"><span className="font-medium">Variant:</span> {item.variant}</p>
                                      )}
                                      {item.partType && (
                                        <p className="text-gray-700"><span className="font-medium">Part Type:</span> {item.partType}</p>
                                      )}
                                      {item.color && (
                                        <p className="text-gray-700"><span className="font-medium">Color:</span> {item.color}</p>
                                      )}
                                      {item.originType && (
                                        <p className="text-gray-700"><span className="font-medium">Origin:</span> {item.originType}</p>
                                      )}
                                      {item.unit && (
                                        <p className="text-gray-700"><span className="font-medium">Unit:</span> {item.unit}</p>
                                      )}
                                    </div>
                                    {item.description && (
                                      <div className="md:col-span-3">
                                        <p className="text-gray-500 font-medium mb-1">Description</p>
                                        <p className="text-gray-700">{item.description}</p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-gray-500 font-medium mb-1">Quantity Details</p>
                                      <p className="text-gray-700"><span className="font-medium">Requested:</span> {item.requestedQty || item.quantity || 0}</p>
                                      <p className="text-gray-700"><span className="font-medium">Approved:</span> {item.approvedQty !== undefined ? item.approvedQty : 'Pending'}</p>
                                      <p className="text-gray-700"><span className="font-medium">Issued:</span> {item.issuedQty !== undefined ? item.issuedQty : 'Not issued'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 font-medium mb-1">Pricing</p>
                                      <p className="text-gray-700"><span className="font-medium">Unit Price:</span> ₹{item.unitPrice.toLocaleString()}</p>
                                      <p className="text-gray-700"><span className="font-medium">Total Price:</span> ₹{(item.totalPrice || (item.unitPrice * (item.requestedQty || item.quantity || 0))).toLocaleString()}</p>
                                    </div>
                                    {item.urgency && (
                                      <div>
                                        <p className="text-gray-500 font-medium mb-1">Urgency</p>
                                        <Badge className={
                                          item.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                                          item.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                          'bg-blue-100 text-blue-800'
                                        }>
                                          {item.urgency.toUpperCase()}
                                        </Badge>
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="md:col-span-2">
                                        <p className="text-gray-500 font-medium mb-1">Notes</p>
                                        <p className="text-gray-700">{item.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="py-3 px-4 text-right font-semibold">
                          Total Amount:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right font-bold text-lg">
                          ₹{purchaseOrder.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-medium">{purchaseOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Quantity</span>
                    <span className="font-medium">
                      {purchaseOrder.items.reduce((sum, item) => sum + (item.requestedQty || item.quantity || 0), 0)}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-semibold">Total Amount</span>
                      <span className="font-bold text-lg text-blue-600">
                        ₹{purchaseOrder.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Purchase Order"
        message={isCIM 
          ? "Are you sure you want to approve this purchase order? After approval, you can issue parts (admin approval will be required for the Parts Issue)."
          : "Are you sure you want to approve this purchase order? After approval, Central Inventory Manager will be able to issue parts (admin approval required for Parts Issue)."
        }
        type="info"
        confirmText="Approve"
        cancelText="Cancel"
        isLoading={isProcessing}
      />

      {/* Issue Parts Modal with Quantity Adjustment */}
      {showIssueModal && purchaseOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800">Issue Parts from Purchase Order</h3>
              <p className="text-sm text-gray-600 mt-1">
                Adjust quantities if needed (you can issue partial quantities). 
                <span className="font-semibold text-yellow-700 block mt-1">⚠️ Note: This will create a Parts Issue that requires admin approval before parts are dispatched.</span>
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {purchaseOrder.items.map((item, index) => {
                  const itemQuantity = item.requestedQty || item.quantity || 0;
                  const approvedItem = approvedItems.find(ai => ai.itemId === item.id);
                  return (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.partName || `Part ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Requested: {itemQuantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 min-w-[120px]">
                          Issue Quantity:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={itemQuantity}
                          value={approvedItem?.approvedQty || itemQuantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            const updatedItems = approvedItems.map(ai =>
                              ai.itemId === item.id
                                ? { ...ai, approvedQty: Math.min(qty, itemQuantity) }
                                : ai
                            );
                            // If item not in list, add it
                            if (!approvedItem) {
                              updatedItems.push({
                                itemId: item.id,
                                approvedQty: Math.min(qty, itemQuantity)
                              });
                            }
                            setApprovedItems(updatedItems);
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">of {itemQuantity}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowIssueModal(false);
                      setApprovedItems([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleIssue}
                    disabled={isProcessing || approvedItems.reduce((sum, item) => sum + item.approvedQty, 0) === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Issue Parts"}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800">Reject Purchase Order</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Reject Order"}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

