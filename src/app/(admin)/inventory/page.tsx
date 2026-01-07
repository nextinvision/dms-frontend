"use client";

import { useState, useMemo, useEffect, startTransition } from "react";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Search,
  LayoutDashboard,
  List,
  ClipboardList,
  Filter,
  ArrowRightLeft,
  Boxes,
  Building2,
  ArrowLeft
} from "lucide-react";
import { toast } from "react-hot-toast";

// Services & Repositories
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import { adminApprovalService } from "@/features/inventory/services/adminApproval.service";
import { serviceCenterService } from "@/features/service-centers/services/service-center.service";
import { inventoryRepository } from "@/core/repositories/inventory.repository";

// Types
import type { CentralStock, PartsIssue } from "@/shared/types/central-inventory.types";
import type { ServiceCenter } from "@/shared/types/service-center.types";
import type { InventoryPart } from "@/core/repositories/inventory.repository";

/**
 * Enhanced Inventory Page for Admin
 * Includes: Overview, Inventory List, and Requests Management
 */
export default function InventoryPage() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'requests' | 'service-centers'>('overview');
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<ServiceCenter | null>(null);

  // Data State
  const [inventory, setInventory] = useState<CentralStock[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PartsIssue[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [serviceCenterInventory, setServiceCenterInventory] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingServiceCenters, setIsLoadingServiceCenters] = useState(false);
  const [isLoadingSCInventory, setIsLoadingSCInventory] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceCenterSearch, setServiceCenterSearch] = useState("");
  const [scInventorySearch, setScInventorySearch] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // --- Initial Data Fetch ---
  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [stockData, requestsData] = await Promise.all([
        centralInventoryRepository.getAllStock(),
        adminApprovalService.getPendingApprovals()
      ]);

      const mappedData: CentralStock[] = stockData.map((item) => ({
        id: item.id,
        partId: item.id,
        partName: item.partName,
        partNumber: item.partNumber,
        hsnCode: item.hsnCode || "",
        category: item.category,
        currentQty: item.stockQuantity,
        allocated: item.allocated || 0,
        available: item.available || item.stockQuantity - (item.allocated || 0),
        minStock: item.reorderPoint,
        maxStock: item.reorderQuantity,
        unitPrice: item.unitPrice,
        costPrice: 0,
        supplier: "Unknown",
        location: "Central",
        warehouse: "Central Warehouse",
        status: item.stockQuantity === 0 ? "Out of Stock" : item.stockQuantity <= item.reorderPoint ? "Low Stock" : "In Stock",
        lastUpdated: item.updatedAt || new Date().toISOString(),
        lastUpdatedBy: "System",
        brandName: "", // Optional fields empty by default
        partType: "NEW"
      }));

      startTransition(() => {
        setInventory(mappedData);
        setPendingRequests(requestsData);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      toast.error("Failed to load inventory data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch service centers when tab is active
  useEffect(() => {
    if (activeTab === 'service-centers' && serviceCenters.length === 0) {
      fetchServiceCenters();
    }
  }, [activeTab, serviceCenters.length]);

  // Fetch service center inventory when one is selected
  useEffect(() => {
    if (selectedServiceCenter) {
      fetchServiceCenterInventory(selectedServiceCenter.id);
    }
  }, [selectedServiceCenter]);

  const fetchServiceCenters = async () => {
    try {
      setIsLoadingServiceCenters(true);
      const centers = await serviceCenterService.getAll();
      setServiceCenters(centers);
    } catch (error) {
      console.error("Failed to fetch service centers:", error);
      toast.error("Failed to load service centers");
    } finally {
      setIsLoadingServiceCenters(false);
    }
  };

  // Helper function to normalize inventory item fields
  const normalizeInventoryItem = (item: any) => {
    const stockQty = item.stockQuantity ?? item.quantity ?? 0;
    const minLevel = item.minStockLevel ?? item.minLevel ?? 0;
    const maxLevel = item.maxStockLevel ?? item.maxLevel ?? 0;
    
    return {
      ...item,
      stockQuantity: stockQty,
      minStockLevel: minLevel,
      maxStockLevel: maxLevel,
      quantity: stockQty,
      minLevel,
      maxLevel,
    };
  };

  // Helper function to calculate part status
  const calculatePartStatus = (stockQty: number, minLevel: number): string => {
    if (stockQty <= 0) return "Out of Stock";
    if (minLevel > 0 && stockQty <= minLevel) return "Low Stock";
    return "In Stock";
  };

  const fetchServiceCenterInventory = async (serviceCenterId: string) => {
    try {
      setIsLoadingSCInventory(true);
      const inventory = await inventoryRepository.getAll({ serviceCenterId });
      const mappedInventory = inventory.map(normalizeInventoryItem);
      setServiceCenterInventory(mappedInventory);
    } catch (error) {
      console.error("Failed to fetch service center inventory:", error);
      toast.error("Failed to load service center inventory");
    } finally {
      setIsLoadingSCInventory(false);
    }
  };

  // --- Derived State ---
  const categories = useMemo(() => {
    const unique = new Set(inventory.map(i => i.category));
    return ["All", ...Array.from(unique)];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsnCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalParts = inventory.length;
    const inStock = inventory.filter(item => item.status === "In Stock").length;
    const lowStock = inventory.filter(item => item.status === "Low Stock").length;
    const outOfStock = inventory.filter(item => item.status === "Out of Stock").length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.unitPrice * item.currentQty), 0);
    const allocatedValue = inventory.reduce((sum, item) => sum + (item.unitPrice * (item.allocated || 0)), 0);

    return { totalParts, inStock, lowStock, outOfStock, totalValue, allocatedValue };
  }, [inventory]);

  // Filtered service centers
  const filteredServiceCenters = useMemo(() => {
    if (!serviceCenterSearch) return serviceCenters;
    const search = serviceCenterSearch.toLowerCase();
    return serviceCenters.filter(center =>
      center.name.toLowerCase().includes(search) ||
      center.code?.toLowerCase().includes(search) ||
      center.city?.toLowerCase().includes(search) ||
      center.email?.toLowerCase().includes(search) ||
      center.phone?.includes(search)
    );
  }, [serviceCenters, serviceCenterSearch]);

  // Filtered service center inventory
  const filteredSCInventory = useMemo(() => {
    if (!scInventorySearch) return serviceCenterInventory;
    const search = scInventorySearch.toLowerCase();
    return serviceCenterInventory.filter(item =>
      item.partName.toLowerCase().includes(search) ||
      item.partNumber?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.oemPartNumber?.toLowerCase().includes(search) ||
      item.brandName?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  }, [serviceCenterInventory, scInventorySearch]);

  // Service center inventory stats
  const scInventoryStats = useMemo(() => {
    const totalParts = serviceCenterInventory.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalQuantity = 0;
    let totalValue = 0;

    serviceCenterInventory.forEach(item => {
      const qty = item.stockQuantity ?? item.quantity ?? 0;
      const minLevel = item.minStockLevel ?? item.minLevel ?? 0;
      const status = calculatePartStatus(qty, minLevel);
      
      if (status === "In Stock") inStock++;
      else if (status === "Low Stock") lowStock++;
      else outOfStock++;
      
      totalQuantity += qty;
      const price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice ?? 0);
      totalValue += qty * price;
    });

    return { totalParts, inStock, lowStock, outOfStock, totalQuantity, totalValue };
  }, [serviceCenterInventory]);

  // --- Handlers ---
  const handleApproveRequest = async (issueId: string) => {
    try {
      await adminApprovalService.approvePartsIssue(issueId, "Admin (System)", "Approved via Inventory Dashboard");
      toast.success("Request approved successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (issueId: string) => {
    // Simple alert for reason entry - in production use a modal
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await adminApprovalService.rejectPartsIssue(issueId, "Admin (System)", reason);
      toast.success("Request rejected");
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject request");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading inventory command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans">

      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Central Inventory</h1>
        <p className="text-slate-500">Manage stock, track value, and approve service center requests.</p>
      </div>

      {/* --- TABS --- */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-fit mb-6 shadow-sm overflow-x-auto">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          label="Overview"
          icon={LayoutDashboard}
        />
        <TabButton
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
          label="Inventory List"
          icon={List}
          count={stats.totalParts}
        />
        <TabButton
          active={activeTab === 'requests'}
          onClick={() => setActiveTab('requests')}
          label="Requests"
          icon={ClipboardList}
          count={pendingRequests.length}
          alert={pendingRequests.length > 0}
        />
        <TabButton
          active={activeTab === 'service-centers'}
          onClick={() => {
            setActiveTab('service-centers');
            setSelectedServiceCenter(null);
          }}
          label="Service Centers Inventory"
          icon={Building2}
        />
      </div>

      {/* --- CONTENT AREA --- */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">

          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Inventory Value"
              value={formatCurrency(stats.totalValue)}
              icon={DollarSign}
              color="purple"
              subValue={`${formatCurrency(stats.allocatedValue)} allocated`}
            />
            <StatCard
              label="Pending Requests"
              value={pendingRequests.length}
              icon={ClipboardList}
              color={pendingRequests.length > 0 ? "orange" : "green"}
              action={() => setActiveTab('requests')}
              actionLabel={pendingRequests.length > 0 ? "Review Now" : undefined}
            />
            <StatCard
              label="Low Stock Items"
              value={stats.lowStock}
              icon={AlertTriangle}
              color={stats.lowStock > 0 ? "yellow" : "slate"}
              action={() => { setStatusFilter("Low Stock"); setActiveTab('inventory'); }}
              actionLabel="View Items"
            />
            <StatCard
              label="Out of Stock"
              value={stats.outOfStock}
              icon={Boxes}
              color={stats.outOfStock > 0 ? "red" : "slate"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                System Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">Database Connection</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">Sync Status</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Synced Just Now</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">Total Parts Count</span>
                  <span className="text-sm font-bold text-slate-900">{stats.totalParts} SKUs</span>
                </div>
              </div>
            </div>

            {/* Allocated Stock Warning */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
              <h3 className="font-bold text-indigo-900 mb-2">Inventory Insights</h3>
              <p className="text-sm text-indigo-700 mb-4">
                You have {formatCurrency(stats.allocatedValue)} worth of inventory currently allocated to pending jobs but not yet deducted. ensure physical counts match "Available" stock.
              </p>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Go to Inventory List <ArrowRightLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY LIST TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">

          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search part name, number, HSN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500"
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Part Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Physical</th>
                    <th className="px-6 py-4 text-center bg-indigo-50/50 text-indigo-700">Allocated</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-700">Available</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        {searchTerm ? "No parts match your search." : "No inventory available."}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{item.partName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{item.partNumber} • {item.hsnCode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600 font-medium">
                          {item.currentQty}
                        </td>
                        <td className="px-6 py-4 text-center bg-indigo-50/30 text-indigo-600 font-medium">
                          {item.allocated || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {item.available !== undefined ? item.available : item.currentQty}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                          ₹{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-slate-500">There are no pending stock requests from service centers.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-purple-200 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-slate-900">{request.serviceCenterName}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase">Pending Approval</span>
                      </div>
                      <p className="text-slate-500 text-sm">Requested by {request.issuedBy} • {new Date(request.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 transition-all"
                      >
                        Approve Request
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Requested Items</h4>
                    <div className="space-y-2">
                      {request.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-900">{item.partName}</span>
                            <span className="text-slate-500 text-xs">{item.partNumber}</span>
                          </div>
                          <div className="font-mono font-medium">x {item.quantity} units</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="text-sm text-slate-600 italic bg-yellow-50 p-3 rounded border border-yellow-100">
                      " {request.notes} "
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SERVICE CENTERS INVENTORY TAB */}
      {activeTab === 'service-centers' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {!selectedServiceCenter ? (
            // Service Centers List View
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Building2 size={20} className="text-purple-600" />
                      All Service Centers
                    </h2>
                    <p className="text-sm text-slate-500">Select a service center to view its inventory</p>
                  </div>
                  <button
                    onClick={fetchServiceCenters}
                    disabled={isLoadingServiceCenters}
                    className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    {isLoadingServiceCenters ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search service centers by name, code, location..."
                    value={serviceCenterSearch}
                    onChange={(e) => setServiceCenterSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                  />
                </div>
                {serviceCenterSearch && (
                  <p className="text-xs text-slate-500 mt-2">
                    Showing {filteredServiceCenters.length} of {serviceCenters.length} service centers
                  </p>
                )}
              </div>

              {isLoadingServiceCenters ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500">Loading service centers...</p>
                </div>
              ) : serviceCenters.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Service Centers</h3>
                  <p className="text-slate-500">No service centers found in the system.</p>
                </div>
              ) : filteredServiceCenters.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Search size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Service Centers Found</h3>
                  <p className="text-slate-500 mb-4">No service centers match your search criteria.</p>
                  <button
                    onClick={() => setServiceCenterSearch("")}
                    className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServiceCenters.map((center) => (
                    <button
                      key={center.id}
                      onClick={() => setSelectedServiceCenter(center)}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-purple-700 transition-colors">
                            {center.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">{center.code}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          center.status === 'Active' || center.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {center.status}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        {center.city && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Location:</span>
                            <span>{center.city}{center.state ? `, ${center.state}` : ''}</span>
                          </div>
                        )}
                        {center.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Phone:</span>
                            <span>{center.phone}</span>
                          </div>
                        )}
                        {center.email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span className="text-xs">{center.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                          View Inventory →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Service Center Inventory View
            <div className="space-y-4">
              {/* Back Button and Header */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => {
                    setSelectedServiceCenter(null);
                    setScInventorySearch("");
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-purple-600 mb-4 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Service Centers
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Building2 size={20} className="text-purple-600" />
                      {selectedServiceCenter.name} - Inventory
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedServiceCenter.code} • {selectedServiceCenter.city || 'Location not specified'}
                    </p>
                  </div>
                  <button
                    onClick={() => selectedServiceCenter && fetchServiceCenterInventory(selectedServiceCenter.id)}
                    disabled={isLoadingSCInventory}
                    className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    {isLoadingSCInventory ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {/* Statistics */}
                {serviceCenterInventory.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">Total Parts</div>
                      <div className="text-lg font-bold text-slate-900">{scInventoryStats.totalParts}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-600 font-medium">In Stock</div>
                      <div className="text-lg font-bold text-green-700">{scInventoryStats.inStock}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xs text-yellow-600 font-medium">Low Stock</div>
                      <div className="text-lg font-bold text-yellow-700">{scInventoryStats.lowStock}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium">Out of Stock</div>
                      <div className="text-lg font-bold text-red-700">{scInventoryStats.outOfStock}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-purple-600 font-medium">Total Value</div>
                      <div className="text-lg font-bold text-purple-700">{formatCurrency(scInventoryStats.totalValue)}</div>
                    </div>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        viewMode === 'table'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <List size={16} className="inline mr-2" />
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Boxes size={16} className="inline mr-2" />
                      Cards
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search parts by name, number, category..."
                    value={scInventorySearch}
                    onChange={(e) => setScInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                  />
                </div>
                {scInventorySearch && (
                  <p className="text-xs text-slate-500 mt-2">
                    Showing {filteredSCInventory.length} of {serviceCenterInventory.length} parts
                  </p>
                )}
              </div>

              {/* Inventory Table */}
              {isLoadingSCInventory ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500">Loading inventory...</p>
                </div>
              ) : serviceCenterInventory.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Package size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Inventory Found</h3>
                  <p className="text-slate-500">This service center has no inventory items.</p>
                </div>
              ) : filteredSCInventory.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Search size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Parts Found</h3>
                  <p className="text-slate-500 mb-4">
                    {scInventorySearch 
                      ? "No parts match your search criteria." 
                      : "This service center has no inventory items."}
                  </p>
                  {scInventorySearch && (
                    <button
                      onClick={() => setScInventorySearch("")}
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : viewMode === 'table' ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                          <th className="px-4 py-3">Part Details</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-center">Stock Qty</th>
                          <th className="px-4 py-3 text-center">Min/Max</th>
                          <th className="px-4 py-3 text-center">Unit Price</th>
                          <th className="px-4 py-3 text-center">Total Value</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSCInventory.map((item) => {
                          const qty = item.stockQuantity ?? item.quantity ?? 0;
                          const minLevel = item.minStockLevel ?? item.minLevel ?? 0;
                          const maxLevel = item.maxStockLevel ?? item.maxLevel ?? 0;
                          const status = calculatePartStatus(qty, minLevel);
                          const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice ?? 0);
                          const totalValue = qty * unitPrice;
                          
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-900">{item.partName}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  {item.partNumber}
                                  {item.oemPartNumber && ` • OEM: ${item.oemPartNumber}`}
                                </div>
                                {item.brandName && (
                                  <div className="text-xs text-slate-400 mt-0.5">Brand: {item.brandName}</div>
                                )}
                                {item.variant && (
                                  <div className="text-xs text-slate-400">Variant: {item.variant}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  {item.category && (
                                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium block">
                                      {item.category}
                                    </span>
                                  )}
                                  {item.partType && (
                                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-medium block">
                                      {item.partType}
                                    </span>
                                  )}
                                  {item.originType && (
                                    <span className="text-xs text-slate-400">{item.originType}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="font-bold text-slate-900">{qty}</div>
                                {item.unit && (
                                  <div className="text-xs text-slate-500">{item.unit}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600 text-xs">
                                <div>Min: {minLevel}</div>
                                <div>Max: {maxLevel}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="font-mono text-slate-700">₹{unitPrice.toLocaleString()}</div>
                                {item.gstRate && (
                                  <div className="text-xs text-slate-500">GST: {item.gstRate}%</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="font-mono font-semibold text-slate-900">₹{totalValue.toLocaleString()}</div>
                                {item.costPrice && (
                                  <div className="text-xs text-slate-500">
                                    Cost: ₹{typeof item.costPrice === 'string' ? parseFloat(item.costPrice).toLocaleString() : item.costPrice.toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={status} />
                                {item.highValuePart && (
                                  <div className="mt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-bold">
                                      High Value
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSCInventory.map((item) => {
                    const qty = item.stockQuantity ?? item.quantity ?? 0;
                    const minLevel = item.minStockLevel ?? item.minLevel ?? 0;
                    const maxLevel = item.maxStockLevel ?? item.maxLevel ?? 0;
                    const status = calculatePartStatus(qty, minLevel);
                    const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice ?? 0);
                    const totalValue = qty * unitPrice;
                    const costPrice = item.costPrice ? (typeof item.costPrice === 'string' ? parseFloat(item.costPrice) : item.costPrice) : 0;
                    
                    return (
                      <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{item.partName}</h3>
                            <div className="text-xs text-slate-500 font-mono mb-2">
                              {item.partNumber}
                              {item.oemPartNumber && ` • ${item.oemPartNumber}`}
                            </div>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="space-y-2 mb-4">
                          {item.category && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Category:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">{item.category}</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-slate-50 p-2 rounded">
                              <div className="text-xs text-slate-500">Stock Qty</div>
                              <div className="font-bold text-slate-900">{qty} {item.unit || ''}</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <div className="text-xs text-slate-500">Min/Max</div>
                              <div className="font-bold text-slate-900">{minLevel}/{maxLevel}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-purple-50 p-2 rounded">
                              <div className="text-xs text-purple-600">Unit Price</div>
                              <div className="font-bold text-purple-700">₹{unitPrice.toLocaleString()}</div>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded">
                              <div className="text-xs text-indigo-600">Total Value</div>
                              <div className="font-bold text-indigo-700">₹{totalValue.toLocaleString()}</div>
                            </div>
                          </div>

                          {costPrice > 0 && (
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-xs text-green-600">Cost Price</div>
                              <div className="font-bold text-green-700">₹{costPrice.toLocaleString()}</div>
                            </div>
                          )}

                          {item.brandName && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Brand:</span>
                              <span className="text-slate-700 font-medium">{item.brandName}</span>
                            </div>
                          )}

                          {item.variant && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Variant:</span>
                              <span className="text-slate-700 font-medium">{item.variant}</span>
                            </div>
                          )}

                          {item.location && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Location:</span>
                              <span className="text-slate-700 font-medium">{item.location}</span>
                            </div>
                          )}

                          {item.partType && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Type:</span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">{item.partType}</span>
                            </div>
                          )}

                          {item.gstRate && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">GST Rate:</span>
                              <span className="text-slate-700 font-medium">{item.gstRate}%</span>
                            </div>
                          )}

                          {item.highValuePart && (
                            <div className="mt-2">
                              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">
                                ⚠ High Value Part
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, label, icon: Icon, count, alert }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${active
          ? "bg-white text-purple-700 shadow-sm ring-1 ring-black/5"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
        }`}
    >
      <Icon size={18} className={active ? "text-purple-600" : "text-slate-400"} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${alert ? "bg-red-100 text-red-600 animate-pulse" : active ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-600"
          }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, subValue, action, actionLabel }: any) {
  const colors: any = {
    purple: "text-purple-600 bg-purple-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
    slate: "text-slate-600 bg-slate-100"
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon size={22} />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 font-medium">{label}</div>
        {subValue && <div className="text-xs text-indigo-500 font-medium mt-1">{subValue}</div>}
      </div>

      {action && (
        <button
          onClick={action}
          className="mt-4 text-xs font-bold text-slate-400 hover:text-purple-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          {actionLabel} <ArrowRightLeft size={12} />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    "In Stock": "bg-green-100 text-green-700 border-green-200",
    "Low Stock": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Out of Stock": "bg-red-100 text-red-700 border-red-200"
  } as const;

  const style = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
      {status}
    </span>
  );
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount.toLocaleString()}`;
}
