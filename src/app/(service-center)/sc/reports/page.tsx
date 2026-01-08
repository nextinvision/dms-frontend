"use client";
import { useState, useEffect } from "react";
import { FileText, Download, TrendingUp, BarChart3, Calendar, Loader2, AlertCircle } from "lucide-react";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  fetchSalesReport,
  fetchServiceVolumeReport,
  fetchTechnicianPerformanceReport,
  fetchInventoryReport,
} from "@/features/reports/utils/report-fetchers";
import {
  downloadReportAsPdf,
  downloadReportAsJson,
} from "@/features/reports/utils/report-download";

interface Report {
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

export default function Reports() {
  const { showSuccess, showError } = useToast();
  const context = getServiceCenterContext();
  const serviceCenterId = context.serviceCenterId;
  const serviceCenterName = context.serviceCenterName || "Service Center";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({});
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const reports: Report[] = [
    {
      id: "sales",
      name: "Daily Sales Summary",
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
      icon: <FileText className="text-purple-600" size={32} />,
    },
    {
      id: "inventory",
      name: "Inventory Report",
      type: "Inventory",
      description: "Stock levels, low stock items, and inventory value",
      icon: <FileText className="text-orange-600" size={32} />,
    },
  ];

  const generateReport = async (reportId: string) => {
    if (!serviceCenterId) {
      showError("Service center information not available");
      return;
    }

    setIsLoading(true);
    setSelectedReport(reportId);

    try {
      switch (reportId) {
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
          showError("Unknown report type");
      }
      showSuccess("Report generated successfully");
    } catch (error: any) {
      console.error("Error generating report:", error);
      showError(error?.message || "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesReportData = async () => {
    if (!serviceCenterId) return;
    const salesData = await fetchSalesReport(serviceCenterId, dateRange);
    setReportData({ sales: salesData });
  };

  const fetchServiceVolumeReportData = async () => {
    if (!serviceCenterId) return;
    const serviceVolumeData = await fetchServiceVolumeReport(serviceCenterId, dateRange);
    setReportData({ serviceVolume: serviceVolumeData });
  };

  const fetchTechnicianPerformanceReportData = async () => {
    if (!serviceCenterId) return;
    const technicianData = await fetchTechnicianPerformanceReport(serviceCenterId, dateRange);
    setReportData({ technicianPerformance: technicianData });
  };

  const fetchInventoryReportData = async () => {
    if (!serviceCenterId) return;
    const inventoryData = await fetchInventoryReport(serviceCenterId, dateRange, false);
    setReportData({ inventory: inventoryData });
  };

  const handleDownload = async (reportId: string, format: 'json' | 'pdf' = 'json') => {
    if (!reportData || Object.keys(reportData).length === 0) {
      showError("Please generate a report first");
      return;
    }

    if (format === 'json') {
      downloadReportAsJson(reportId, reportData, serviceCenterName, () => showSuccess("Report downloaded successfully"));
    } else {
      try {
        await downloadReportAsPdf(
          reportId,
          reportData,
          serviceCenterName,
          dateRange,
          () => showSuccess("PDF downloaded successfully"),
          (error: any) => showError(error?.response?.data?.message || "Failed to download PDF")
        );
      } catch (error) {
        // Error already handled in downloadReportAsPdf callback
      }
    }
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Reports</h1>
          <p className="text-gray-500">
            Generate and view service center reports for {serviceCenterName}
          </p>
          {!serviceCenterId && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={16} />
              <p className="text-sm text-yellow-800">Service center information not available</p>
            </div>
          )}
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Date Range
            </h3>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="mb-4">{report.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{report.type}</p>
                <p className="text-xs text-gray-500 mb-4">{report.description}</p>
                <Button
                  onClick={() => generateReport(report.id)}
                  disabled={isLoading || !serviceCenterId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading && selectedReport === report.id ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Report Results */}
        {selectedReport && Object.keys(reportData).length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {reports.find((r) => r.id === selectedReport)?.name} - Results
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedReport, 'pdf')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleDownload(selectedReport, 'json')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2" size={16} />
                  Download JSON
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {/* Sales Report */}
              {selectedReport === "sales" && reportData.sales && (
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
                  {reportData.sales.revenueByMonth.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Revenue by Month</h4>
                      <div className="space-y-2">
                        {reportData.sales.revenueByMonth.map((item, idx) => (
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
              )}

              {/* Service Volume Report */}
              {selectedReport === "service-volume" && reportData.serviceVolume && (
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
              )}

              {/* Technician Performance Report */}
              {selectedReport === "technician-performance" && reportData.technicianPerformance && (
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
                              <Badge variant={tech.efficiency >= 80 ? "success" : tech.efficiency >= 60 ? "warning" : "danger"}>
                                {tech.efficiency}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventory Report */}
              {selectedReport === "inventory" && reportData.inventory && (
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
                                  <Badge variant="success">{part.usageCount}</Badge>
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
                                  <Badge variant={part.usageCount === 0 ? "danger" : "warning"}>
                                    {part.usageCount}
                                  </Badge>
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
                                    <Badge variant="info">{part.usageCount}</Badge>
                                  ) : (
                                    <span className="text-gray-400">0</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 border text-right">₹{part.price.toLocaleString()}</td>
                                <td className="px-4 py-2 border text-right font-semibold">₹{part.value.toLocaleString()}</td>
                                <td className="px-4 py-2 border text-center">
                                  <Badge 
                                    variant={
                                      part.status === "Out of Stock" ? "danger" :
                                      part.status === "Low Stock" ? "warning" : "success"
                                    }
                                  >
                                    {part.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
