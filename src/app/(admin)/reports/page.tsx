"use client";
import { useState, useEffect } from "react";
import { Download, ArrowLeft, TrendingUp, BarChart3, Package, Users, Building2, Loader2 } from "lucide-react";
import { serviceCenterService } from "@/features/service-centers/services/service-center.service";
import type { ServiceCenter } from "@/shared/types/service-center.types";
import { toast } from "react-hot-toast";
import {
  fetchSalesReport,
  fetchServiceVolumeReport,
  fetchTechnicianPerformanceReport,
  fetchInventoryReport,
  filterByDateRange,
} from "@/features/reports/utils/report-fetchers";
import {
  downloadReportAsPdf,
  downloadReportAsJson,
} from "@/features/reports/utils/report-download";

interface ReportType {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ReactNode;
}

interface ReportData {
  sales?: {
    totalRevenue: number;
    totalInvoices: number;
    avgInvoiceValue: number;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  };
  serviceVolume?: {
    totalJobCards: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgCompletionTime: string;
  };
  technicianPerformance?: {
    technicians: Array<{
      name: string;
      completedJobs: number;
      avgRating: number;
      efficiency: number;
    }>;
  };
  inventory?: {
    totalParts: number;
    lowStockCount: number;
    totalValue: number;
    topMovingParts: Array<{ 
      name: string; 
      quantity: number; 
      usageCount: number;
      price: number;
      value: number;
    }>;
    lowMovingParts: Array<{ 
      name: string; 
      quantity: number; 
      usageCount: number;
      price: number;
      value: number;
    }>;
    allParts: Array<{
      name: string;
      partNumber: string;
      category: string;
      quantity: number;
      minStockLevel: number;
      price: number;
      value: number;
      usageCount: number;
      status: string;
    }>;
  };
}

export default function ReportsPage() {
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<ServiceCenter | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Available report types
  const reportTypes: ReportType[] = [
    {
      id: "sales",
      name: "Sales Report",
      type: "Financial",
      description: "Revenue, invoices, and financial performance",
      icon: <TrendingUp className="text-blue-600" size={32} />,
    },
    {
      id: "service-volume",
      name: "Service Volume Report",
      type: "Operational",
      description: "Job cards, completion rates, and service metrics",
      icon: <BarChart3 className="text-green-600" size={32} />,
    },
    {
      id: "technician-performance",
      name: "Technician Performance",
      type: "Performance",
      description: "Individual technician productivity and ratings",
      icon: <Users className="text-purple-600" size={32} />,
    },
    {
      id: "inventory",
      name: "Inventory Report",
      type: "Inventory",
      description: "Stock levels, movements, and inventory analysis",
      icon: <Package className="text-orange-600" size={32} />,
    },
  ];

  // Fetch service centers on mount
  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setIsLoadingCenters(true);
      const centers = await serviceCenterService.getAll();
      setServiceCenters(centers);
    } catch (error) {
      console.error("Failed to fetch service centers:", error);
      toast.error("Failed to load service centers");
    } finally {
      setIsLoadingCenters(false);
    }
  };



  // Handle service center selection
  const handleServiceCenterClick = (center: ServiceCenter) => {
    setSelectedServiceCenter(center);
    setSelectedReportType(null);
    setReportData({});
  };

  // Handle back to service centers
  const handleBackToCenters = () => {
    setSelectedServiceCenter(null);
    setSelectedReportType(null);
    setReportData({});
  };

  // Handle back to report types
  const handleBackToReportTypes = () => {
    setSelectedReportType(null);
    setReportData({});
  };

  // Handle report type selection
  const handleReportTypeClick = (reportTypeId: string) => {
    setSelectedReportType(reportTypeId);
    setReportData({});
  };

  // Generate report
  const generateReport = async (reportTypeId: string) => {
    if (!selectedServiceCenter) {
      toast.error("Please select a service center first");
      return;
    }

    setIsGeneratingReport(true);
    setSelectedReport(reportTypeId);

    try {
      switch (reportTypeId) {
        case "sales":
          await fetchSalesReportData();
          break;
        case "service-volume":
          await fetchServiceVolumeReportData();
          break;
        case "technician-performance":
          await fetchTechnicianPerformanceReportData();
          break;
        case "inventory":
          await fetchInventoryReportData();
          break;
        default:
          toast.error("Unknown report type");
      }
      toast.success("Report generated successfully");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error?.message || "Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fetch Sales Report
  const fetchSalesReportData = async () => {
    if (!selectedServiceCenter) return;
    const salesData = await fetchSalesReport(selectedServiceCenter.id, dateRange);
    setReportData({ sales: salesData });
  };

  // Fetch Service Volume Report
  const fetchServiceVolumeReportData = async () => {
    if (!selectedServiceCenter) return;
    const serviceVolumeData = await fetchServiceVolumeReport(selectedServiceCenter.id, dateRange);
    setReportData({ serviceVolume: serviceVolumeData });
  };

  // Fetch Technician Performance Report
  const fetchTechnicianPerformanceReportData = async () => {
    if (!selectedServiceCenter) return;
    const technicianData = await fetchTechnicianPerformanceReport(selectedServiceCenter.id, dateRange);
    setReportData({ technicianPerformance: technicianData });
  };

  // Fetch Inventory Report
  const fetchInventoryReportData = async () => {
    if (!selectedServiceCenter) return;
    const inventoryData = await fetchInventoryReport(selectedServiceCenter.id, dateRange, true);
    setReportData({ inventory: inventoryData });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {(selectedServiceCenter || selectedReportType) && (
            <button
              onClick={selectedReportType ? handleBackToReportTypes : handleBackToCenters}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900">
            {selectedReportType 
              ? `${selectedServiceCenter?.name} - ${reportTypes.find(r => r.id === selectedReportType)?.name}`
              : selectedServiceCenter 
                ? `${selectedServiceCenter.name} - Select Report Type`
                : "Reports"}
          </h1>
        </div>
        <p className="text-slate-500">
          {selectedReportType
            ? `Generate and view ${reportTypes.find(r => r.id === selectedReportType)?.name.toLowerCase()} for ${selectedServiceCenter?.name}`
            : selectedServiceCenter
              ? `Select a report type to generate for ${selectedServiceCenter.name}`
              : "Select a service center to generate reports"}
        </p>
      </div>

      {!selectedServiceCenter ? (
        /* Service Centers Selection */
        <div className="space-y-4">
          {isLoadingCenters ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceCenters.map((center) => (
                <button
                  key={center.id}
                  onClick={() => handleServiceCenterClick(center)}
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
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                      Generate Reports →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : !selectedReportType ? (
        /* Report Type Selection */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Select Report Type</h2>
            <p className="text-sm text-slate-500">Choose the type of report you want to generate for {selectedServiceCenter.name}</p>
          </div>

          {/* Date Range Selection */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Date Range</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Report Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((reportType) => (
              <button
                key={reportType.id}
                onClick={() => handleReportTypeClick(reportType.id)}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-purple-50 transition-colors">
                    {reportType.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-purple-700 transition-colors mb-1">
                      {reportType.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">{reportType.description}</p>
                    <span className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                      Generate Report →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Report Generation and Display */
        <div className="space-y-6">
          {Object.keys(reportData).length === 0 ? (
            /* Generate Report Button */
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="max-w-md mx-auto">
                {reportTypes.find(r => r.id === selectedReportType)?.icon}
                <h2 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
                  {reportTypes.find(r => r.id === selectedReportType)?.name}
                </h2>
                <p className="text-slate-500 mb-6">
                  {reportTypes.find(r => r.id === selectedReportType)?.description}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left">
                  <div className="text-sm text-slate-600 mb-2">
                    <strong>Service Center:</strong> {selectedServiceCenter?.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    <strong>Date Range:</strong> {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => generateReport(selectedReportType!)}
                  disabled={isGeneratingReport}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Display Generated Report */
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {reportTypes.find((r) => r.id === selectedReport)?.name} - Results
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedServiceCenter?.name} • {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      downloadReportAsPdf(
                        selectedReport!,
                        reportData,
                        selectedServiceCenter?.name || 'Unknown',
                        dateRange,
                        () => toast.success("PDF downloaded successfully"),
                        (error: any) => toast.error(error?.response?.data?.message || "Failed to download PDF")
                      );
                    }}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      downloadReportAsJson(
                        selectedReport!,
                        reportData,
                        selectedServiceCenter?.name || 'Unknown',
                        () => toast.success("JSON downloaded successfully")
                      );
                    }}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download JSON
                  </button>
                </div>
              </div>

              {/* Sales Report */}
              {selectedReport === "sales" && reportData.sales && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-700">
                          ₹{reportData.sales.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                        <p className="text-2xl font-bold text-green-700">
                          {reportData.sales.totalInvoices}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Avg Invoice Value</p>
                        <p className="text-2xl font-bold text-purple-700">
                          ₹{Math.round(reportData.sales.avgInvoiceValue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {reportData.sales.revenueByMonth && reportData.sales.revenueByMonth.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Revenue by Month</h4>
                        <div className="space-y-2">
                          {reportData.sales.revenueByMonth.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="font-medium">{item.month}</span>
                              <span className="text-blue-600 font-semibold">
                                ₹{item.revenue.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Volume Report */}
              {selectedReport === "service-volume" && reportData.serviceVolume && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Job Cards</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {reportData.serviceVolume.totalJobCards}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-700">
                          {reportData.serviceVolume.completed}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {reportData.serviceVolume.inProgress}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-red-700">
                          {reportData.serviceVolume.pending}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Average Completion Time</p>
                      <p className="text-xl font-bold text-gray-800">
                        {reportData.serviceVolume.avgCompletionTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Technician Performance Report */}
              {selectedReport === "technician-performance" && reportData.technicianPerformance && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Technician</th>
                            <th className="px-4 py-2 text-center">Completed Jobs</th>
                            <th className="px-4 py-2 text-center">Avg Rating</th>
                            <th className="px-4 py-2 text-center">Efficiency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.technicianPerformance.technicians.map((tech, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-2 font-medium">{tech.name}</td>
                              <td className="px-4 py-2 text-center">{tech.completedJobs}</td>
                              <td className="px-4 py-2 text-center">{tech.avgRating.toFixed(1)}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  tech.efficiency >= 80 ? 'bg-green-100 text-green-700' :
                                  tech.efficiency >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {tech.efficiency}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Report */}
              {selectedReport === "inventory" && reportData.inventory && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Parts</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {reportData.inventory.totalParts}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                        <p className="text-2xl font-bold text-red-700">
                          {reportData.inventory.lowStockCount}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Inventory Value</p>
                        <p className="text-2xl font-bold text-green-700">
                          ₹{reportData.inventory.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Top Moving Parts */}
                    {reportData.inventory.topMovingParts && reportData.inventory.topMovingParts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3 text-lg">Top Moving Parts (Most Used)</h4>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left border">Part Name</th>
                                <th className="px-4 py-2 text-center border">Stock Qty</th>
                                <th className="px-4 py-2 text-center border">Usage Count</th>
                                <th className="px-4 py-2 text-right border">Unit Price</th>
                                <th className="px-4 py-2 text-right border">Total Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.inventory.topMovingParts.map((part, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 border font-medium">{part.name}</td>
                                  <td className="px-4 py-2 border text-center">{part.quantity}</td>
                                  <td className="px-4 py-2 border text-center">
                                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                      {part.usageCount}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 border text-right">₹{part.price.toLocaleString()}</td>
                                  <td className="px-4 py-2 border text-right font-semibold">₹{part.value.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Low Moving Parts */}
                    {reportData.inventory.lowMovingParts && reportData.inventory.lowMovingParts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3 text-lg">Low Moving Parts (Rarely Used)</h4>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left border">Part Name</th>
                                <th className="px-4 py-2 text-center border">Stock Qty</th>
                                <th className="px-4 py-2 text-center border">Usage Count</th>
                                <th className="px-4 py-2 text-right border">Unit Price</th>
                                <th className="px-4 py-2 text-right border">Total Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.inventory.lowMovingParts.map((part, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 border font-medium">{part.name}</td>
                                  <td className="px-4 py-2 border text-center">{part.quantity}</td>
                                  <td className="px-4 py-2 border text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      part.usageCount === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {part.usageCount}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 border text-right">₹{part.price.toLocaleString()}</td>
                                  <td className="px-4 py-2 border text-right font-semibold">₹{part.value.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* All Parts List */}
                    {reportData.inventory.allParts && reportData.inventory.allParts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3 text-lg">All Parts ({reportData.inventory.allParts.length})</h4>
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left border">Part Name</th>
                                <th className="px-4 py-2 text-left border">Part Number</th>
                                <th className="px-4 py-2 text-left border">Category</th>
                                <th className="px-4 py-2 text-center border">Stock Qty</th>
                                <th className="px-4 py-2 text-center border">Min Level</th>
                                <th className="px-4 py-2 text-center border">Usage</th>
                                <th className="px-4 py-2 text-right border">Unit Price</th>
                                <th className="px-4 py-2 text-right border">Total Value</th>
                                <th className="px-4 py-2 text-center border">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.inventory.allParts.map((part, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 border font-medium">{part.name}</td>
                                  <td className="px-4 py-2 border text-sm text-gray-600">{part.partNumber}</td>
                                  <td className="px-4 py-2 border text-sm text-gray-600">{part.category}</td>
                                  <td className="px-4 py-2 border text-center">{part.quantity}</td>
                                  <td className="px-4 py-2 border text-center text-sm">{part.minStockLevel || "-"}</td>
                                  <td className="px-4 py-2 border text-center">
                                    {part.usageCount > 0 ? (
                                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                        {part.usageCount}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">0</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 border text-right">₹{part.price.toLocaleString()}</td>
                                  <td className="px-4 py-2 border text-right font-semibold">₹{part.value.toLocaleString()}</td>
                                  <td className="px-4 py-2 border text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      part.status === "Out of Stock" ? 'bg-red-100 text-red-700' :
                                      part.status === "Low Stock" ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {part.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReportData({});
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Generate New Report
                </button>
                <button
                  onClick={() => {
                    setSelectedReportType(null);
                    setReportData({});
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Select Different Report Type
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
