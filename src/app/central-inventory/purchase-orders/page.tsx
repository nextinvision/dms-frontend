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
import {
  calculatePOItemIssuedQuantities,
  calculateRemainingQuantity,
  hasClosedSubPo
} from "@/shared/utils/po-fulfillment.utils";
import type { PurchaseOrder, PurchaseOrderItem } from "@/shared/types/central-inventory.types";

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
              po.items.forEach((poItem: PurchaseOrderItem) => {
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

          // Note: Debug logging removed for production - uncomment if needed for troubleshooting

          // Calculate issued quantities per PO item
          const itemIssuedQty = calculatePOItemIssuedQuantities(po.items, relatedIssues);
          const itemHasClosedSubPo = new Map<string, boolean>();

          // Check for closed sub-POs
          relatedIssues.forEach(issue => {
            issue.items.forEach(issueItem => {
              if (hasClosedSubPo(issueItem)) {
                // Find matching PO item to mark it as having closed sub-PO
                const poItem = po.items.find((item: PurchaseOrderItem) => {
                  return (
                    (item.centralInventoryPartId && issueItem.partId && item.centralInventoryPartId === issueItem.partId) ||
                    (item.partId && issueItem.partId && item.partId === issueItem.partId) ||
                    (item.partName && issueItem.partName &&
                      item.partName.toLowerCase().trim() === issueItem.partName.toLowerCase().trim()) ||
                    (item.partNumber && issueItem.partNumber &&
                      item.partNumber.toLowerCase().trim() === issueItem.partNumber.toLowerCase().trim())
                  );
                });
                if (poItem) {
                  itemHasClosedSubPo.set(poItem.id, true);
                }
              }
            });
          });

          // Calculate remaining items and fulfillment status
          const remainingItems: PurchaseOrderWithFulfillment['remainingItems'] = [];
          let fullyFulfilledCount = 0;
          let partiallyFulfilledCount = 0;
          let itemsWithClosedSubPo = 0;

          po.items.forEach((item: PurchaseOrderItem) => {
            const requestedQty = Number(item.requestedQty || item.quantity || 0);
            const issuedQty = Number(itemIssuedQty.get(item.id) || 0);
            const remainingQty = calculateRemainingQuantity(requestedQty, issuedQty);
            const hasClosedSubPo = itemHasClosedSubPo.get(item.id) || false;

            // Check if item is fully fulfilled
            // Criteria: 
            // 1. issuedQty >= requestedQty (all requested quantity has been issued)
            // 2. Allow very small tolerance for rounding errors (0.01)
            // 3. If there's a closed sub-PO (ending with 'C'), it indicates fully fulfilled
            //    But we still verify quantities match to prevent false positives
            const isFullyFulfilled = requestedQty > 0 && (
              // Primary check: issued quantity must be >= requested quantity (with tiny rounding tolerance)
              issuedQty >= requestedQty - 0.01
            );

            // Note: Closed sub-PO mismatch warning removed - quantities are verified regardless

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
          // 2. All items have no remaining quantity
          // 3. We verify quantities match exactly (within tolerance)
          let fulfillmentStatus: "not_fulfilled" | "partially_fulfilled" | "fully_fulfilled";

          if (po.items.length === 0) {
            fulfillmentStatus = "not_fulfilled";
          } else {
            // Check each item individually
            const allItemsFullyIssued = po.items.every((item: PurchaseOrderItem) => {
              const requestedQty = Number(item.requestedQty || item.quantity || 0);
              const issuedQty = Number(itemIssuedQty.get(item.id) || 0);
              // Item is fully fulfilled if requestedQty > 0 and issuedQty >= requestedQty (within tolerance)
              return requestedQty > 0 && issuedQty >= requestedQty - 0.01;
            });

            // Check if there are any remaining items
            const hasRemainingItems = remainingItems.length > 0;

            if (allItemsFullyIssued && !hasRemainingItems) {
              // All items are fully issued and no remaining items - fully fulfilled
              fulfillmentStatus = "fully_fulfilled";
            } else if (fullyFulfilledCount > 0 || partiallyFulfilledCount > 0 || hasRemainingItems) {
              // Some items are fulfilled or there are remaining items - partially fulfilled
              fulfillmentStatus = "partially_fulfilled";
            } else {
              // No items have been issued - not fulfilled
              fulfillmentStatus = "not_fulfilled";
            }
          }

          // Final verification: Double-check that fully fulfilled POs have no remaining items
          if (fulfillmentStatus === "fully_fulfilled" && remainingItems.length > 0) {
            // If there are remaining items, it can't be fully fulfilled
            fulfillmentStatus = "partially_fulfilled";
          }

          // Note: Debug logging removed for production - uncomment if needed for troubleshooting

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
        // EXCLUDE fully fulfilled POs - they should only appear in "Fulfilled" tab
        filtered = filtered.filter((po) => {
          const isApproved = po.status === "approved";
          const isNotFullyFulfilled = po.fulfillmentStatus !== "fully_fulfilled";
          const hasRemainingItems = po.remainingItems && po.remainingItems.length > 0;

          // Must be approved, not fully fulfilled, and have remaining items
          return isApproved && isNotFullyFulfilled && hasRemainingItems;
        });
      } else if (statusFilter === "fulfilled") {
        // Show POs that are fully fulfilled (all parts issued)
        // Only include POs that are truly fully fulfilled
        filtered = filtered.filter((po) => {
          // Must be fully fulfilled based on our calculation
          const isFullyFulfilled = po.fulfillmentStatus === "fully_fulfilled";
          // Should have no remaining items
          const hasNoRemainingItems = !po.remainingItems || po.remainingItems.length === 0;

          return isFullyFulfilled && hasNoRemainingItems;
        });
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
          po.items.some((item) => item.partName?.toLowerCase().includes(query))
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${statusFilter === filter.key
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

