"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Eye,
  ShoppingCart,
  FileText,
  TrendingUp,
  LucideIcon,
  Clock,
  User,
  Car,
  ArrowRight,
  Truck,
  MapPin,
  Search,
  FileCheck,
  Link as LinkIcon,
} from "lucide-react";
import { StatsCard } from "@/components/data-display/StatsCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePartsApproval } from "@/shared/hooks/usePartsApproval";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { inventoryPurchaseOrderService, type InventoryPurchaseOrder } from "@/features/inventory/services/inventoryPurchaseOrder.service";
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import type { InventoryStats, Part } from "@/shared/types/inventory.types";
import type { JobCardPartsRequest } from "@/shared/types/jobcard-inventory.types";
import type { PartsIssue as CentralPartsIssue } from "@/shared/types/central-inventory.types";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  bg: string;
  link: string;
}

// Reuse mapping helper from Approvals Page (or duplicate for now to avoid specific shared file dependency hell right now)
// Reuse mapping helper from Approvals Page
const mapPartsRequestToFrontend = (req: any): JobCardPartsRequest => {
  const status = req.status;
  // Map COMPLETED to 'approved' for dashboard visual consistency (Green badge)
  const dashboardStatus = status === 'COMPLETED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending';

  return {
    id: req.id,
    jobCardId: req.jobCard?.jobCardNumber || req.jobCardId,
    vehicleNumber: req.jobCard?.vehicle?.registration || req.jobCard?.vehicle?.vehicleMake || "N/A",
    customerName: req.jobCard?.customer?.name || "N/A",
    requestedBy: req.jobCard?.assignedEngineer?.name || "Service Engineer",
    requestedAt: req.createdAt,
    status: dashboardStatus,
    parts: (req.items || []).map((item: any) => ({
      partId: item.id,
      partName: item.partName || `Part #${item.partNumber}`,
      quantity: item.requestedQty || item.quantity,
      isWarranty: item.isWarranty,
      serialNumber: item.partNumber
    })),
    // Flags for logic
    scManagerApproved: status === 'APPROVED' || status === 'COMPLETED',
    inventoryManagerAssigned: status === 'COMPLETED',
  };
};


export default function InventoryManagerDashboard() {
  const { pendingRequests, refresh } = usePartsApproval();
  const [stats, setStats] = useState<InventoryStats>({
    totalParts: 0,
    lowStockParts: 0,
    outOfStockParts: 0,
    totalValue: 0,
    pendingOrders: 0,
    recentEntries: 0,
  });
  const [recentRequests, setRecentRequests] = useState<JobCardPartsRequest[]>([]);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<InventoryPurchaseOrder[]>([]);
  const [dispatchedPartsIssues, setDispatchedPartsIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch parts and calculate stats
        const parts = await partsMasterService.getAll();
        const totalParts = parts.length;
        const lowStockParts = parts.filter((p) => p.stockQuantity < p.minStockLevel && p.stockQuantity > 0).length;
        const outOfStockParts = parts.filter((p) => p.stockQuantity === 0).length;
        const totalValue = parts.reduce((sum, p) => sum + (p.price ?? 0) * p.stockQuantity, 0);

        // Fetch recent parts requests (last 5)
        const scContext = getServiceCenterContext();
        const allRequestsData = await jobCardService.getPendingPartsRequests(scContext.serviceCenterId || undefined);
        const allRequests = allRequestsData.map(mapPartsRequestToFrontend);

        const recent = allRequests
          .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
          .slice(0, 5);

        // Count recent entries (last 7 days) - check parts entries
        const { partsEntryService } = await import("@/features/inventory/services/partsEntry.service");
        const recentEntriesData = await partsEntryService.getRecent(10);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEntries = recentEntriesData.filter(
          (e: any) => e.createdAt && new Date(e.createdAt) >= sevenDaysAgo
        ).length;

        // Fetch recent purchase orders
        try {
          const allPOs = await inventoryPurchaseOrderService.getAll();
          const recentPOs = allPOs
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
            .slice(0, 5);
          setRecentPurchaseOrders(recentPOs);
        } catch (error) {
          console.error("Error fetching purchase orders:", error);
          setRecentPurchaseOrders([]);
        }

        // Fetch dispatched parts issues for this service center
        try {
          const context = getServiceCenterContext();
          if (context.serviceCenterId) {
            const allPartsIssues = await centralInventoryRepository.getAllPartsIssues();
            // Filter parts issues dispatched to this service center
            const dispatchedIssues = allPartsIssues.filter((issue: CentralPartsIssue) => {
              const isForThisSC = issue.serviceCenterId === context.serviceCenterId ||
                String(issue.serviceCenterId) === String(context.serviceCenterId);
              const isDispatched = issue.status === 'dispatched' ||
                issue.status === 'issued' ||
                issue.status === 'admin_approved';
              return isForThisSC && isDispatched;
            });

            // Sort by dispatched date or created date, most recent first
            const sortedIssues = dispatchedIssues.sort((a, b) => {
              const dateA = a.transportDetails?.expectedDelivery
                ? new Date(a.transportDetails.expectedDelivery).getTime()
                : new Date(a.issuedAt).getTime();
              const dateB = b.transportDetails?.expectedDelivery
                ? new Date(b.transportDetails.expectedDelivery).getTime()
                : new Date(b.issuedAt).getTime();
              return dateB - dateA;
            });

            setDispatchedPartsIssues(sortedIssues.slice(0, 5));
          }
        } catch (error) {
          console.error("Error fetching dispatched parts issues:", error);
          setDispatchedPartsIssues([]);
        }

        setStats({
          totalParts,
          lowStockParts,
          outOfStockParts,
          totalValue,
          pendingOrders: pendingRequests.length,
          recentEntries,
        });

        setRecentRequests(recent);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    refresh(); // Refresh pending requests
  }, [pendingRequests.length, refresh]);

  // Helper function to get status badge for purchase orders
  const getPOStatusBadge = (status: string, dispatchStatus?: string) => {
    const statusLower = status.toLowerCase();
    if (dispatchStatus === 'dispatched') {
      return <Badge variant="success" className="bg-green-100 text-green-800">Dispatched</Badge>;
    }
    if (dispatchStatus === 'approved') {
      return <Badge variant="info" className="bg-blue-100 text-blue-800">Approved</Badge>;
    }
    switch (statusLower) {
      case "draft":
        return <Badge variant="default" className="bg-gray-500 text-white">Draft</Badge>;
      case "pending_approval":
      case "pending":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "issued":
        return <Badge variant="info">Issued</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper function to get status badge for parts issues
  const getPartsIssueStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "dispatched":
      case "issued":
        return <Badge variant="success" className="bg-green-100 text-green-800">Dispatched</Badge>;
      case "admin_approved":
        return <Badge variant="info" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "completed":
        return <Badge variant="success" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper function to filter dispatched issues by search query
  const filterDispatchedIssues = (issue: CentralPartsIssue) => {
    if (!trackingSearchQuery) return true;
    const transportDetails = issue.transportDetails || {};
    const trackingNumber = transportDetails.trackingNumber || "";
    const transporter = transportDetails.transporter || "";
    const searchLower = trackingSearchQuery.toLowerCase();
    return trackingNumber.toLowerCase().includes(searchLower) ||
      transporter.toLowerCase().includes(searchLower) ||
      issue.issueNumber.toLowerCase().includes(searchLower);
  };

  const quickActions: QuickAction[] = [
    {
      label: "Add New Part",
      icon: PlusCircle,
      bg: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/inventory-manager/parts-master",
    },
    {
      label: "View All Parts",
      icon: Eye,
      bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      link: "/inventory-manager/parts-master",
    },
    {
      label: "Create Order",
      icon: ShoppingCart,
      bg: "bg-gradient-to-r from-orange-500 to-yellow-500",
      link: "/inventory-manager/parts-order-entry",
    },
    {
      label: "Pending Approvals",
      icon: CheckCircle,
      bg: "bg-gradient-to-r from-purple-500 to-pink-500",
      link: "/inventory-manager/approvals",
    },
  ];

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Inventory Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your inventory and parts efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Parts"
            value={stats.totalParts}
            icon={Package}
            trend="neutral"
          />
          <StatsCard
            title="Low Stock Parts"
            value={stats.lowStockParts}
            change={`${stats.outOfStockParts} out of stock`}
            icon={AlertTriangle}
            trend={stats.lowStockParts > 0 ? "down" : "neutral"}
          />
          <StatsCard
            title="Total Inventory Value"
            value={`₹${stats.totalValue.toLocaleString()}`}
            icon={TrendingUp}
            trend="neutral"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingOrders}
            icon={CheckCircle}
            trend={stats.pendingOrders > 0 ? "up" : "neutral"}
          />
          <StatsCard
            title="Recent Entries"
            value={stats.recentEntries}
            icon={FileText}
            trend="neutral"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.link}
                  className={`${action.bg} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon size={32} className="mb-3" />
                    <span className="font-semibold">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-orange-500 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Parts Confirmation Needed ({pendingRequests.length})
                  </h3>
                </div>
                <Badge variant="warning">{pendingRequests.length} Pending</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">
                You have {pendingRequests.length} pending job card parts request{pendingRequests.length > 1 ? "s" : ""} waiting for approval from SC Managers.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/inventory-manager/approvals"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Review Requests
                  <ArrowRight size={16} />
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Recent Parts Requests from Job Cards */}
        {recentRequests.length > 0 && (
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Parts Requests</h3>
                </div>
                <Link
                  href="/inventory-manager/approvals"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border ${request.status === "pending"
                      ? "bg-orange-50 border-orange-200"
                      : request.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            Job Card: {request.jobCardId}
                          </h4>
                          <Badge
                            variant={
                              request.status === "pending"
                                ? "warning"
                                : request.status === "approved"
                                  ? "success"
                                  : "danger"
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Car size={14} />
                            <span>{request.vehicleNumber || request.vehicleId || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{request.customerName || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>
                              {new Date(request.requestedAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Requested Parts:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.parts.map((part, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-gray-200"
                          >
                            <Package size={12} />
                            {part.partName} (Qty: {part.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                    {request.status === "pending" && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Requested by:</span> {typeof request.requestedBy === 'object' && request.requestedBy !== null ? (request.requestedBy as any).name || 'Unknown' : request.requestedBy}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Empty State for Recent Requests */}
        {recentRequests.length === 0 && pendingRequests.length === 0 && (
          <Card className="mb-8">
            <CardBody>
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  No pending parts requests. When SC Managers create job cards with parts, they will appear here.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Recent Purchase Orders */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
              </div>
              <Link
                href="/inventory-manager/parts-order-view"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading purchase orders...</p>
              </div>
            ) : recentPurchaseOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No purchase orders yet</p>
                <p className="text-xs text-gray-400 mt-2">Create a purchase order to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPurchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/inventory-manager/parts-order-view`}
                          className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          {po.poNumber}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">{po.items.length} item(s)</p>
                      </div>
                      {getPOStatusBadge(po.status, po.dispatchStatus)}
                    </div>
                    {(po.trackingNumber || po.transporter) && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {po.trackingNumber && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Tracking:</span> {po.trackingNumber}
                          </div>
                        )}
                        {po.transporter && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Transporter:</span> {po.transporter}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(po.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Dispatched Parts Issues */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Dispatched Parts Issues</h3>
              </div>
              <Badge variant="info" className="bg-blue-100 text-blue-800">
                {dispatchedPartsIssues.filter(filterDispatchedIssues).length} Active
              </Badge>
            </div>
            {/* Search by Tracking ID */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={trackingSearchQuery}
                onChange={(e) => setTrackingSearchQuery(e.target.value)}
                placeholder="Search by Tracking ID, Company Name, or Issue Number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading dispatched parts...</p>
              </div>
            ) : dispatchedPartsIssues.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No dispatched parts issues</p>
                <p className="text-xs text-gray-400 mt-2">Parts dispatched from central inventory will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dispatchedPartsIssues
                  .filter(filterDispatchedIssues)
                  .map((issue: CentralPartsIssue) => {

                    const transportDetails = issue.transportDetails || {};
                    const trackingNumber = transportDetails.trackingNumber;
                    const transporter = transportDetails.transporter;
                    const expectedDelivery = transportDetails.expectedDelivery;

                    return (
                      <div
                        key={issue.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="text-indigo-600" size={18} />
                              <span className="font-semibold text-indigo-600">
                                {issue.issueNumber}
                              </span>
                              {getPartsIssueStatusBadge(issue.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm text-gray-600">
                                {issue.items.length} item(s) • Total: ₹{issue.totalAmount.toLocaleString()}
                              </p>
                              {(issue.purchaseOrderNumber || issue.purchaseOrderId) && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <FileCheck size={12} />
                                  <span className="font-medium">PO: {issue.purchaseOrderNumber || issue.purchaseOrderId}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Purchase Order Link - If linked to a PO */}
                        {(issue.purchaseOrderNumber || issue.purchaseOrderId) && (
                          <div className="mt-2 mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-medium text-indigo-900">Linked Purchase Order:</span>
                              <Link
                                href={`/inventory-manager/parts-order-view`}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                              >
                                {issue.purchaseOrderNumber || issue.purchaseOrderId}
                                <LinkIcon size={10} />
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Transport Details - Highlighted for Tracking */}
                        {(trackingNumber || transporter || expectedDelivery) && (
                          <div className="mt-3 pt-3 border-t border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="w-5 h-5 text-blue-600" />
                              <h4 className="text-sm font-bold text-blue-900">Tracking Information</h4>
                              {(issue.purchaseOrderNumber || issue.purchaseOrderId) && (
                                <Badge variant="info" className="ml-auto text-xs bg-indigo-100 text-indigo-700">
                                  Track PO: {issue.purchaseOrderNumber || issue.purchaseOrderId}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {trackingNumber && (
                                <div className="flex items-start gap-2 bg-white p-2 rounded border border-blue-200">
                                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-600">Tracking ID</p>
                                    <p className="text-sm font-bold text-blue-900 break-all">{trackingNumber}</p>
                                    <p className="text-xs text-gray-500 mt-1">Use this ID to track your shipment</p>
                                  </div>
                                </div>
                              )}
                              {transporter && (
                                <div className="flex items-start gap-2 bg-white p-2 rounded border border-green-200">
                                  <Truck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-600">Company Name</p>
                                    <p className="text-sm font-bold text-green-900">{transporter}</p>
                                    <p className="text-xs text-gray-500 mt-1">Shipping company</p>
                                  </div>
                                </div>
                              )}
                              {expectedDelivery && (
                                <div className="flex items-start gap-2 bg-white p-2 rounded border border-orange-200">
                                  <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-600">Expected Delivery</p>
                                    <p className="text-sm font-bold text-orange-900">
                                      {new Date(expectedDelivery).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Estimated arrival</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Items Summary */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Parts:</p>
                          <div className="flex flex-wrap gap-2">
                            {issue.items.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-gray-200"
                              >
                                <Package size={10} />
                                {item.partName} (Qty: {item.quantity || item.issuedQty || item.approvedQty || 0})
                              </span>
                            ))}
                            {issue.items.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                                +{issue.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 mt-2">
                          Dispatched: {issue.issuedAt ? new Date(issue.issuedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
