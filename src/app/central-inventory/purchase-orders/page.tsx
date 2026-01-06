"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Building,
  Package,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import type { PurchaseOrder } from "@/shared/types/central-inventory.types";

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "not_fully_fulfilled" | "fulfilled";

interface PurchaseOrderWithFulfillment extends PurchaseOrder {
  fulfillmentStatus: "not_fulfilled" | "partially_fulfilled" | "fully_fulfilled";
  remainingItems: Array<{
    id: string;
    partName: string;
    partNumber?: string;
    requestedQty: number;
    issuedQty: number;
    remainingQty: number;
  }>;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithFulfillment[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrderWithFulfillment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const orders = await centralInventoryRepository.getAllPurchaseOrders();
        const partsIssues = await centralInventoryRepository.getAllPartsIssues();
        
        // Calculate fulfillment status for each PO
        const ordersWithFulfillment: PurchaseOrderWithFulfillment[] = orders.map(po => {
          // Find all parts issues related to this PO
          // Try multiple matching strategies for purchaseOrderId
          let relatedIssues = partsIssues.filter(issue => {
            // Strategy 1: Direct ID match
            if (issue.purchaseOrderId === po.id) return true;
            return false;
          });
          
          // Fallback: If no issues found by purchaseOrderId, try to match by service center and items
          // This handles cases where purchaseOrderId might not be set
          if (relatedIssues.length === 0 && po.serviceCenterId) {
            const serviceCenterIssues = partsIssues.filter(issue => 
              issue.serviceCenterId === po.serviceCenterId &&
              issue.status !== 'pending_admin_approval' &&
              issue.status !== 'cim_approved' &&
              issue.status !== 'admin_rejected'
            );
            
            // Try to match by items - if all PO items can be found in a parts issue, consider it related
            relatedIssues = serviceCenterIssues.filter(issue => {
              let matchedItems = 0;
              po.items.forEach(poItem => {
                const foundInIssue = issue.items.some(issueItem => {
                  // Try to match the item
                  return (
                    (poItem.centralInventoryPartId && issueItem.partId && poItem.centralInventoryPartId === issueItem.partId) ||
                    (poItem.partId && issueItem.partId && poItem.partId === issueItem.partId) ||
                    (poItem.partId && issueItem.fromStock && poItem.partId === issueItem.fromStock) ||
                    (poItem.partName && issueItem.partName && 
                     poItem.partName.toLowerCase().trim() === issueItem.partName.toLowerCase().trim()) ||
                    (poItem.partNumber && issueItem.partNumber && 
                     poItem.partNumber.toLowerCase().trim() === issueItem.partNumber.toLowerCase().trim())
                  );
                });
                if (foundInIssue) matchedItems++;
              });
              // If at least 50% of items match, consider it related
              return matchedItems > 0 && matchedItems >= Math.ceil(po.items.length * 0.5);
            });
          }
          
          // Debug: Log related issues for troubleshooting
          if (relatedIssues.length > 0) {
            console.log(`PO ${po.poNumber} (${po.id}) has ${relatedIssues.length} related parts issues:`, 
              relatedIssues.map(issue => ({
                id: issue.id,
                issueNumber: issue.issueNumber,
                purchaseOrderId: issue.purchaseOrderId,
                status: issue.status,
                itemsCount: issue.items.length,
              }))
            );
          } else if (po.status === 'approved') {
            // Log if approved PO has no related issues (might indicate missing purchaseOrderId)
            console.warn(`PO ${po.poNumber} (${po.id}) is approved but has no related parts issues. ` +
              `This might indicate parts issues are not linked to this PO.`);
          }
          
          // Calculate issued quantities per PO item
          const itemIssuedQty = new Map<string, number>();
          const itemHasClosedSubPo = new Map<string, boolean>();
          
          relatedIssues.forEach(issue => {
            issue.items.forEach(issueItem => {
              // Enhanced matching: try multiple strategies to match PO items with parts issue items
              const poItem = po.items.find(poItem => {
                // Strategy 1: Match by centralInventoryPartId (most reliable)
                if (poItem.centralInventoryPartId && issueItem.partId && 
                    poItem.centralInventoryPartId === issueItem.partId) {
                  return true;
                }
                // Strategy 2: Match by partId
                if (poItem.partId && issueItem.partId && poItem.partId === issueItem.partId) {
                  return true;
                }
                // Strategy 3: Match by fromStock (parts issue item's fromStock should match PO item's partId)
                if (poItem.partId && issueItem.fromStock && poItem.partId === issueItem.fromStock) {
                  return true;
                }
                if (poItem.centralInventoryPartId && issueItem.fromStock && 
                    poItem.centralInventoryPartId === issueItem.fromStock) {
                  return true;
                }
                // Strategy 4: Match by partName (case-insensitive, trimmed)
                if (poItem.partName && issueItem.partName) {
                  const poName = poItem.partName.toLowerCase().trim();
                  const issueName = issueItem.partName.toLowerCase().trim();
                  if (poName === issueName && poName !== '') {
                    return true;
                  }
                }
                // Strategy 5: Match by partNumber (case-insensitive, trimmed)
                if (poItem.partNumber && issueItem.partNumber) {
                  const poNumber = poItem.partNumber.toLowerCase().trim();
                  const issueNumber = issueItem.partNumber.toLowerCase().trim();
                  if (poNumber === issueNumber && poNumber !== '') {
                    return true;
                  }
                }
                // Strategy 6: Match by HSN code as fallback
                if (poItem.hsnCode && issueItem.hsnCode && 
                    poItem.hsnCode.toLowerCase().trim() === issueItem.hsnCode.toLowerCase().trim()) {
                  return true;
                }
                return false;
              });
              
              if (poItem) {
                // Aggregate issued quantities - use issuedQty from parts issue item
                // Also check dispatch records if available (more reliable)
                let issueQty = Number(issueItem.issuedQty) || 0;
                
                // If dispatch records are available, sum them up (more accurate)
                if (issueItem.dispatches && Array.isArray(issueItem.dispatches) && issueItem.dispatches.length > 0) {
                  const dispatchQty = issueItem.dispatches.reduce((sum: number, dispatch: any) => {
                    return sum + (Number(dispatch.quantity) || 0);
                  }, 0);
                  // Use dispatch quantity if it's higher (more accurate)
                  if (dispatchQty > issueQty) {
                    issueQty = dispatchQty;
                  }
                }
                
                const currentIssued = itemIssuedQty.get(poItem.id) || 0;
                itemIssuedQty.set(poItem.id, currentIssued + issueQty);
                
                // Check if sub-PO number has [C] postfix (indicates fully fulfilled)
                // Check both in issueItem and in dispatch records
                const hasClosedSubPo = 
                  (issueItem.subPoNumber && (issueItem.subPoNumber.endsWith('C') || issueItem.subPoNumber.includes('_C'))) ||
                  (issueItem.dispatches && Array.isArray(issueItem.dispatches) && 
                   issueItem.dispatches.some((d: any) => 
                     d.subPoNumber && (d.subPoNumber.endsWith('C') || d.subPoNumber.includes('_C'))
                   ));
                
                if (hasClosedSubPo) {
                  itemHasClosedSubPo.set(poItem.id, true);
                }
              } else {
                // Debug: Log unmatched items
                console.warn(`Could not match parts issue item to PO item:`, {
                  poId: po.id,
                  poNumber: po.poNumber,
                  issueItem: {
                    partId: issueItem.partId,
                    fromStock: issueItem.fromStock,
                    partName: issueItem.partName,
                    partNumber: issueItem.partNumber,
                    issuedQty: issueItem.issuedQty,
                  },
                  poItems: po.items.map(item => ({
                    id: item.id,
                    partId: item.partId,
                    centralInventoryPartId: item.centralInventoryPartId,
                    partName: item.partName,
                    partNumber: item.partNumber,
                  })),
                });
              }
            });
          });
          
          // Calculate remaining items and fulfillment status
          const remainingItems: PurchaseOrderWithFulfillment['remainingItems'] = [];
          let fullyFulfilledCount = 0;
          let partiallyFulfilledCount = 0;
          let itemsWithClosedSubPo = 0;
          
          po.items.forEach(item => {
            const requestedQty = Number(item.requestedQty || item.quantity || 0);
            const issuedQty = Number(itemIssuedQty.get(item.id) || item.issuedQty || 0);
            const remainingQty = Math.max(0, requestedQty - issuedQty);
            const hasClosedSubPo = itemHasClosedSubPo.get(item.id) || false;
            
            // Check if item is fully fulfilled
            // Criteria: 
            // 1. issuedQty >= requestedQty (all requested quantity has been issued)
            // 2. Allow very small tolerance for rounding errors (0.01) - but NOT for missing quantities
            // 3. Closed sub-PO (ending with 'C') indicates fully fulfilled ONLY if issuedQty >= requestedQty
            //    We don't trust closed sub-PO alone if quantities don't match - this prevents false positives
            const isFullyFulfilled = requestedQty > 0 && (
              // Primary check: issued quantity must be >= requested quantity (with tiny rounding tolerance)
              (issuedQty >= requestedQty - 0.01) &&
              // Secondary check: if there's a closed sub-PO, verify it's not a false positive
              // Only trust closed sub-PO if issuedQty is very close to requestedQty (within 0.01)
              (!hasClosedSubPo || Math.abs(issuedQty - requestedQty) <= 0.01)
            );
            
            if (remainingQty > 0) {
              remainingItems.push({
                id: item.id,
                partName: item.partName || 'Unknown Part',
                partNumber: item.partNumber,
                requestedQty,
                issuedQty,
                remainingQty,
              });
            }
            
            if (isFullyFulfilled) {
              fullyFulfilledCount++;
              if (hasClosedSubPo) {
                itemsWithClosedSubPo++;
              }
            } else if (issuedQty > 0) {
              partiallyFulfilledCount++;
            }
          });
          
          // Determine fulfillment status
          // A PO is fully fulfilled ONLY if:
          // 1. All items have issuedQty >= requestedQty (with minimal rounding tolerance of 0.01)
          // 2. We do NOT trust closed sub-PO alone - quantities must match
          // This prevents false positives where a PO is marked as fulfilled when quantities don't match
          let fulfillmentStatus: "not_fulfilled" | "partially_fulfilled" | "fully_fulfilled";
          if (po.items.length === 0) {
            fulfillmentStatus = "not_fulfilled";
          } else if (fullyFulfilledCount === po.items.length && fullyFulfilledCount > 0) {
            // Verify all items are truly fully fulfilled by checking quantities
            const allItemsFullyIssued = po.items.every(item => {
              const requestedQty = Number(item.requestedQty || item.quantity || 0);
              const issuedQty = Number(itemIssuedQty.get(item.id) || 0);
              return requestedQty > 0 && issuedQty >= requestedQty - 0.01; // Allow tiny rounding tolerance only
            });
            
            if (allItemsFullyIssued) {
              fulfillmentStatus = "fully_fulfilled";
            } else {
              // Some items don't have enough issued quantity - mark as partially fulfilled
              fulfillmentStatus = "partially_fulfilled";
            }
          } else if (fullyFulfilledCount > 0 || partiallyFulfilledCount > 0) {
            fulfillmentStatus = "partially_fulfilled";
          } else {
            fulfillmentStatus = "not_fulfilled";
          }
          
          // Additional verification: If backend says fulfilled, verify quantities match
          // Don't blindly trust backend - verify actual issued quantities
          if (po.status === "fulfilled" && fulfillmentStatus !== "fully_fulfilled") {
            // Re-check: only trust backend if all items truly have issuedQty >= requestedQty
            const allItemsTrulyFulfilled = po.items.every(item => {
              const requestedQty = Number(item.requestedQty || item.quantity || 0);
              const issuedQty = Number(itemIssuedQty.get(item.id) || item.issuedQty || 0);
              return requestedQty > 0 && issuedQty >= requestedQty - 0.01; // Strict check with minimal tolerance
            });
            if (allItemsTrulyFulfilled) {
              fulfillmentStatus = "fully_fulfilled";
            } else {
              // Backend says fulfilled but quantities don't match - mark as partially fulfilled
              fulfillmentStatus = "partially_fulfilled";
            }
          }
          
          // Debug logging for troubleshooting - log all POs for analysis
          console.log(`PO ${po.poNumber} (${po.id}) fulfillment analysis:`, {
            status: fulfillmentStatus,
            poStatus: po.status,
            totalItems: po.items.length,
            fullyFulfilled: fullyFulfilledCount,
            partiallyFulfilled: partiallyFulfilledCount,
            itemsWithClosedSubPo,
            relatedIssuesCount: relatedIssues.length,
            itemDetails: po.items.map(item => {
              const requestedQty = Number(item.requestedQty || item.quantity || 0);
              const issuedQty = Number(itemIssuedQty.get(item.id) || item.issuedQty || 0);
              const hasClosedSubPo = itemHasClosedSubPo.get(item.id) || false;
              return {
                id: item.id,
                partName: item.partName,
                partNumber: item.partNumber,
                partId: item.partId,
                centralInventoryPartId: item.centralInventoryPartId,
                requestedQty,
                issuedQty,
                remainingQty: Math.max(0, requestedQty - issuedQty),
                hasClosedSubPo,
                isFulfilled: requestedQty > 0 && (issuedQty >= requestedQty || (hasClosedSubPo && issuedQty > 0)),
              };
            }),
            relatedIssues: relatedIssues.map(issue => ({
              id: issue.id,
              issueNumber: issue.issueNumber,
              purchaseOrderId: issue.purchaseOrderId,
              status: issue.status,
              items: issue.items.map(item => ({
                partId: item.partId,
                fromStock: item.fromStock,
                partName: item.partName,
                partNumber: item.partNumber,
                requestedQty: item.requestedQty,
                issuedQty: item.issuedQty,
                subPoNumber: item.subPoNumber,
              })),
            })),
          });
          
          return {
            ...po,
            fulfillmentStatus,
            remainingItems,
          };
        });
        
        setPurchaseOrders(ordersWithFulfillment);
        setFilteredOrders(ordersWithFulfillment);
      } catch (error) {
        console.error("Failed to fetch purchase orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    let filtered = [...purchaseOrders];

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "not_fully_fulfilled") {
        // Show POs that are approved and have some parts issued but not all
        filtered = filtered.filter((po) => 
          po.status === "approved" && 
          (po.fulfillmentStatus === "partially_fulfilled" || po.fulfillmentStatus === "not_fulfilled")
        );
      } else if (statusFilter === "fulfilled") {
        // Show POs that are fully fulfilled (all parts issued, sub-PO has [C])
        // Also include POs with status "fulfilled" for backward compatibility
        filtered = filtered.filter((po) => 
          po.fulfillmentStatus === "fully_fulfilled" || 
          po.status === "fulfilled" ||
          po.status === "partially_fulfilled" && po.fulfillmentStatus === "fully_fulfilled"
        );
      } else {
      filtered = filtered.filter((po) => po.status === statusFilter);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(query) ||
          po.serviceCenterName.toLowerCase().includes(query) ||
          po.serviceCenterCode?.toLowerCase().includes(query) ||
          po.serviceCenterCity?.toLowerCase().includes(query) ||
          po.serviceCenterState?.toLowerCase().includes(query) ||
          po.serviceCenterAddress?.toLowerCase().includes(query) ||
          po.requestedBy.toLowerCase().includes(query) ||
          po.items.some((item) => item.partName.toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
  }, [purchaseOrders, searchQuery, statusFilter]);

  const getStatusBadge = (po: PurchaseOrderWithFulfillment) => {
    // Show fulfillment status if PO is approved
    if (po.status === "approved") {
      if (po.fulfillmentStatus === "fully_fulfilled") {
        return <Badge className="bg-gray-100 text-gray-800">Fulfilled</Badge>;
      } else if (po.fulfillmentStatus === "partially_fulfilled") {
        return <Badge className="bg-blue-100 text-blue-800">Partially Fulfilled</Badge>;
      }
    }
    
    // Default status badges
    const variants: Record<PurchaseOrder["status"], { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending Approval" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      partially_fulfilled: { color: "bg-blue-100 text-blue-800", label: "Partially Fulfilled" },
      fulfilled: { color: "bg-gray-100 text-gray-800", label: "Fulfilled" },
    };
    const variant = variants[po.status] || variants.pending;
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

  const statusCounts = {
    all: purchaseOrders.length,
    pending: purchaseOrders.filter((po) => po.status === "pending").length,
    approved: purchaseOrders.filter((po) => po.status === "approved").length,
    rejected: purchaseOrders.filter((po) => po.status === "rejected").length,
    not_fully_fulfilled: purchaseOrders.filter((po) => 
      po.status === "approved" && 
      (po.fulfillmentStatus === "partially_fulfilled" || po.fulfillmentStatus === "not_fulfilled")
    ).length,
    fulfilled: purchaseOrders.filter((po) => po.fulfillmentStatus === "fully_fulfilled").length,
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading purchase orders from service centers...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Purchase Orders</h1>
          <p className="text-gray-500">
            View and manage purchase orders from service center inventory managers
            {purchaseOrders.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({purchaseOrders.length} order{purchaseOrders.length !== 1 ? 's' : ''} from {new Set(purchaseOrders.map(po => po.serviceCenterName)).size} service center{new Set(purchaseOrders.map(po => po.serviceCenterName)).size !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by PO number, service center, location, part name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "All", icon: FileCheck },
                    { key: "pending", label: "Pending", icon: Clock },
                    { key: "approved", label: "Approved", icon: CheckCircle },
                    { key: "rejected", label: "Rejected", icon: XCircle },
                    { key: "not_fully_fulfilled", label: "Not Fully Fulfilled", icon: AlertCircle },
                    { key: "fulfilled", label: "Fulfilled", icon: CheckCircle },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key as FilterStatus)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      statusFilter === filter.key
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <filter.icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                      {statusCounts[filter.key as keyof typeof statusCounts]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Purchase Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No purchase orders found</p>
                {searchQuery || statusFilter !== "all" ? (
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm mt-2">
                    No purchase orders have been submitted by service center inventory managers yet
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((po) => (
              <Card key={po.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/central-inventory/purchase-orders/${po.id}`}
                          className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {po.poNumber}
                        </Link>
                        {getStatusBadge(po)}
                        {getPriorityBadge(po.priority)}
                      </div>
                      {/* Service Center Information - Prominently Displayed */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                        <div className="flex items-start gap-3">
                          <Building className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900 mb-1">
                              {po.serviceCenterName}
                              {po.serviceCenterCode && (
                                <span className="text-blue-600 font-normal ml-2">({po.serviceCenterCode})</span>
                              )}
                            </div>
                            {(po.serviceCenterAddress || po.serviceCenterCity || po.serviceCenterState) && (
                              <div className="text-sm text-gray-700 space-y-1">
                                {po.serviceCenterAddress && (
                                  <div>{po.serviceCenterAddress}</div>
                                )}
                                <div>
                                  {[po.serviceCenterCity, po.serviceCenterState, po.serviceCenterPinCode]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              </div>
                            )}
                            {(po.serviceCenterPhone || po.serviceCenterEmail) && (
                              <div className="text-xs text-gray-600 mt-2 space-x-3">
                                {po.serviceCenterPhone && (
                                  <span>📞 {po.serviceCenterPhone}</span>
                                )}
                                {po.serviceCenterEmail && (
                                  <span>✉️ {po.serviceCenterEmail}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Requested By:</span> {po.requestedBy}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span> {po.items.length} part(s)
                        </div>
                        <div>
                          <span className="font-medium">Total Amount:</span> ₹
                          {po.totalAmount.toLocaleString()}
                        </div>
                        {po.jobCardId && (
                          <div>
                            <span className="font-medium">Job Card:</span> {po.jobCardId}
                          </div>
                        )}
                        {po.vehicleNumber && (
                          <div>
                            <span className="font-medium">Vehicle:</span> {po.vehicleNumber}
                          </div>
                        )}
                      </div>
                      
                      {/* Show remaining items for partially fulfilled POs */}
                      {po.fulfillmentStatus === "partially_fulfilled" && po.remainingItems.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold text-yellow-900 text-sm">
                              Remaining Parts to Issue ({po.remainingItems.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {po.remainingItems.slice(0, 3).map((item) => (
                              <div key={item.id} className="text-xs text-yellow-800">
                                <span className="font-medium">{item.partName}</span>
                                {item.partNumber && <span className="text-yellow-600"> ({item.partNumber})</span>}
                                <span className="ml-2">
                                  - Remaining: <span className="font-semibold">{item.remainingQty}</span> of {item.requestedQty}
                                </span>
                              </div>
                            ))}
                            {po.remainingItems.length > 3 && (
                              <div className="text-xs text-yellow-600 italic">
                                +{po.remainingItems.length - 3} more item(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Requested: {new Date(po.requestedAt).toLocaleString()}
                        {po.approvedAt && (
                          <> • Approved: {new Date(po.approvedAt).toLocaleString()}</>
                        )}
                        {po.rejectedAt && (
                          <> • Rejected: {new Date(po.rejectedAt).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {po.fulfillmentStatus === "partially_fulfilled" && po.status === "approved" && (
                        <Link
                          href={`/central-inventory/purchase-orders/${po.id}?issueRemaining=true`}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Issue Remaining Parts"
                        >
                          <Package className="w-5 h-5" />
                        </Link>
                      )}
                    <Link
                      href={`/central-inventory/purchase-orders/${po.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

