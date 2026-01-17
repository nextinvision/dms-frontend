"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Package, TrendingUp, PlusCircle, Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import type { CentralStock } from "@/shared/types/central-inventory.types";
import type { Part, PartFormData } from "@/features/inventory/types/inventory.types";
import * as XLSX from "xlsx";
import { PartsMasterForm } from "./PartsMasterForm";
import { getInitialFormData, type PartsMasterFormData } from "./form.schema";
import { mapPartToFormData, mapFormDataToPartFormData } from "./form.utils";

type FilterStatus = "all" | "In Stock" | "Low Stock" | "Out of Stock";

export default function CentralStockPage() {
  const [stock, setStock] = useState<CentralStock[]>([]);
  const [filteredStock, setFilteredStock] = useState<CentralStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Add New Parts Modal State
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [formData, setFormData] = useState<PartsMasterFormData>(getInitialFormData());

  // Bulk Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    success: number;
    failed: number;
    merged?: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setIsLoading(true);
      const stockData = await centralInventoryRepository.getAllStock();
      setStock(stockData);
      setFilteredStock(stockData);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...stock];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.partName.toLowerCase().includes(query) ||
          s.partNumber.toLowerCase().includes(query) ||
          s.hsnCode.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.location.toLowerCase().includes(query)
      );
    }

    setFilteredStock(filtered);
  }, [stock, searchQuery, statusFilter]);

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Map form data to PartFormData
      const partData = mapFormDataToPartFormData(formData);

      // For central inventory, we don't set a serviceCenterId
      // This marks it as central stock
      delete partData.serviceCenterId;

      // Require partName
      if (!partData.partName?.trim()) {
        alert("Please enter a Part Name to save the part.");
        return;
      }

      // Create the part
      await partsMasterService.create(partData);

      // Refresh stock list
      await fetchStock();

      // Close modal and reset form
      setShowAddPartModal(false);
      setFormData(getInitialFormData());

      alert("Part added successfully to central stock!");
    } catch (error) {
      console.error("Failed to add part:", error);
      alert(error instanceof Error ? error.message : "Failed to add part. Please try again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExtensions = [".xlsx", ".xls", ".csv"];

    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension) && !validTypes.includes(file.type)) {
      alert("Please upload a valid Excel file (.xlsx, .xls) or CSV file.");
      return;
    }

    setUploadFile(file);
  };

  const handleExcelUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploadProgress({ success: 0, failed: 0, errors: [] });

      const fileData = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

      // Map Excel columns to PartFormData
      const partsData: PartFormData[] = jsonData.map((row: any) => {
        const getValue = (keys: string[]) => {
          for (const key of keys) {
            const found = Object.keys(row).find(
              (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
            );
            if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
              return row[found];
            }
          }
          return "";
        };

        const parseNumber = (val: any): number => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const cleaned = val.replace(/[%₹,\s]/g, '').trim();
            return parseFloat(cleaned) || 0;
          }
          return 0;
        };

        const parseBoolean = (val: any): boolean => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            return val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';
          }
          return false;
        };

        const salePricePreGst = parseNumber(getValue(["Sale Price Pre GST", "Sale Price Pre Gst", "sale_price_pre_gst", "Price Pre GST", "pricePreGst"]));
        const purchasePrice = parseNumber(getValue(["PURCHASE PRICE", "Purchase Price", "purchase_price", "PurchasePrice"]));
        const totalPrice = parseNumber(getValue(["TOTAL PRICE", "Total Price", "total_price", "TotalPrice"]));

        return {
          oemPartNumber: String(getValue(["OEM PART NUMBER", "OEM Part Number", "oem_part_number", "OemPartNumber"]) || ""),
          partName: String(getValue(["Part Name", "PartName", "part_name", "Name"]) || ""),
          partNumber: String(getValue(["Part Number", "PartNumber", "part_number", "Number"]) || ""),
          originType: String(getValue(["ORIGIN TYPE", "Origin Type", "origin_type", "OriginType"]) || "NEW").replace(/\s*\/\s*/g, '/'),
          category: String(getValue(["Category", "category", "Category Name"]) || ""),
          description: String(getValue(["Description", "description", "Desc"]) || ""),
          stockQuantity: parseInt(getValue(["Stock Quantity", "Opening Stock", "Initial Stock", "stock_quantity", "StockQuantity"]) || "0") || 0,
          minStockLevel: parseInt(getValue(["Min Stock", "MinStock", "min_stock", "Min Stock Level"]) || "0") || 0,
          maxStockLevel: 100,
          unit: String(getValue(["Unit", "unit", "UOM"]) || "piece"),
          brandName: String(getValue(["Brand Name", "BrandName", "brand_name", "Brand"]) || ""),
          variant: String(getValue(["Variant", "variation"]) || ""),
          partType: String(getValue(["Part Type", "PartType", "part_type"]) || ""),
          color: String(getValue(["Color", "colour", "Colour"]) || ""),
          costPrice: purchasePrice,
          pricePreGst: parseNumber(getValue(["Pre GST Amount To Us", "Pre GST Amount", "pricePreGst", "Price Pre Gst To Us"]) || purchasePrice),
          gstRateInput: parseNumber(getValue(["GST Rate Input", "GstRateInput", "gst_rate_input"])),
          gstInput: parseNumber(getValue(["GST INPUT", "GST Input", "gst_input", "GstInput"])),
          unitPrice: salePricePreGst > 0 ? salePricePreGst : totalPrice,
          price: salePricePreGst > 0 ? salePricePreGst : totalPrice,
          gstRate: parseNumber(getValue(["GST Rate Output", "GstRateOutput", "gst_rate_output"])) || 18,
          gstRateOutput: parseNumber(getValue(["GST Rate Output", "GstRateOutput", "gst_rate_output"])),
          totalPrice: totalPrice,
          totalGst: parseNumber(getValue(["TOTAL GST", "Total GST", "total_gst", "TotalGst"])),
          labourName: String(getValue(["Associated Labour Name", "Labour Name", "labourName", "Estimated Labour"]) || ""),
          labourCode: String(getValue(["Associated Labour Code", "Labour Code", "labourCode"]) || ""),
          labourWorkTime: String(getValue(["Work Time", "WorkTime", "work_time", "Estimated Labour Work Time"]) || ""),
          labourRate: parseNumber(getValue(["Labour Rate", "LabourRate", "labour_rate"])),
          labourGstRate: parseNumber(getValue(["Labour GST Rate", "LabourGstRate", "labour_gst_rate"])),
          labourPrice: parseNumber(getValue(["LABOUR PRICE", "Labour Price", "labour_price", "LabourPrice"])),
          highValuePart: parseBoolean(getValue(["High Value Part", "HighValuePart", "high_value_part"])),
          // No serviceCenterId - this is central inventory
        } as PartFormData;
      });

      const validPartsData = partsData.filter((p) => p.partName?.trim());

      if (validPartsData.length === 0) {
        alert("No valid parts found in the Excel file. Please check the format.");
        setUploadFile(null);
        return;
      }

      const result = await partsMasterService.bulkCreate(validPartsData);
      setUploadProgress(result);

      if (result.success > 0) {
        await fetchStock();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadProgress(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to upload Excel file:", error);
      alert("Failed to process Excel file. Please check the format and try again.");
      setUploadProgress({ success: 0, failed: 0, errors: ["Failed to process file"] });
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "OEM PART NUMBER": "2W_000000000272_003",
        "Part Name": "COCKPIT TOP SHELL ANTHRACITE",
        "Part Number": "_003",
        "ORIGIN TYPE": "OLD/NEW",
        "Category": "BODY PANEL",
        "PURCHASE PRICE": 950,
        "Description": "HMI AND HEADLIGHT COVER",
        "Stock Quantity": 10,
        "Min Stock": 2,
        "Unit": "1",
        "Brand Name": "OLA ELECTRIC",
        "Variant": "S1 PRO, S1",
        "Part Type": "PANEL",
        "Color": "ANTHRACITE",
        "Pre GST Amount To Us": 1400,
        "GST Rate Input": "18%",
        "Sale Price Pre GST": 1652,
        "GST Rate Output": "18%",
        "Associated Labour Name": "TOP COCKIT FITTING",
        "Associated Labour Code": "LB_000000000121",
        "Work Time": "0.3M",
        "Labour Rate": 180,
        "Labour GST Rate": "18%",
        "LABOUR PRICE": 212.4,
        "GST INPUT": 32.4,
        "TOTAL PRICE": 1864.4,
        "TOTAL GST": 284.4,
        "High Value Part": "NO",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parts");
    XLSX.writeFile(wb, "central_stock_template.xlsx");
  };

  const getStatusBadge = (status: CentralStock["status"]) => {
    const variants: Record<CentralStock["status"], { color: string; label: string }> = {
      "In Stock": { color: "bg-green-100 text-green-800", label: "In Stock" },
      "Low Stock": { color: "bg-yellow-100 text-yellow-800", label: "Low Stock" },
      "Out of Stock": { color: "bg-red-100 text-red-800", label: "Out of Stock" },
    };
    const variant = variants[status] || variants["In Stock"];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const statusCounts = {
    all: stock.length,
    "In Stock": stock.filter((s) => s.status === "In Stock").length,
    "Low Stock": stock.filter((s) => s.status === "Low Stock").length,
    "Out of Stock": stock.filter((s) => s.status === "Out of Stock").length,
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading stock...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Central Stock</h1>
            <p className="text-gray-500">Manage central warehouse inventory</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowUploadModal(true);
                setUploadFile(null);
                setUploadProgress(null);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload size={18} className="mr-2" />
              Bulk Upload
            </Button>
            <Button
              onClick={() => {
                setFormData(getInitialFormData());
                setShowAddPartModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusCircle size={18} className="mr-2" />
              Add New Part
            </Button>
            <Link
              href="/central-inventory/stock/update"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-5 h-5" />
              Update Stock
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by part name, SKU, category, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "All", icon: Package },
                    { key: "In Stock", label: "In Stock", icon: Package },
                    { key: "Low Stock", label: "Low Stock", icon: TrendingUp },
                    { key: "Out of Stock", label: "Out of Stock", icon: Package },
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

        {/* Stock List */}
        {filteredStock.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No stock items found</p>
                {searchQuery || statusFilter !== "all" ? (
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                ) : null}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Part Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        SKU / Part Number
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Current Qty
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Min/Max
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Unit Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Total Value
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium">{item.partName}</p>
                          {item.partCode && (
                            <p className="text-sm text-gray-400">Code: {item.partCode}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">{item.hsnCode}</p>
                          <p className="text-xs text-gray-400">{item.partNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                        <td className="py-3 px-4 text-right font-medium">{item.currentQty}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {item.minStock} / {item.maxStock}
                        </td>
                        <td className="py-3 px-4 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          ₹{(item.currentQty * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <p>{item.location}</p>
                          <p className="text-xs text-gray-400">{item.warehouse}</p>
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Add Part Modal */}
        <Modal
          isOpen={showAddPartModal}
          onClose={() => {
            setShowAddPartModal(false);
            setFormData(getInitialFormData());
          }}
          title="Add New Part to Central Stock"
        >
          <PartsMasterForm
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleAddPart}
            isEditing={false}
            showServiceCenter={false}
            submitButtonText="Add to Central Stock"
            submitButtonClass="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-6"
          />
        </Modal>

        {/* Bulk Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadProgress(null);
          }}
          title="Bulk Upload Parts to Central Stock"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Excel File Format</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your Excel file should have the following columns:
              </p>
              <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                <li><strong>Required:</strong> Part Name</li>
                <li><strong>Basic Info (optional):</strong> OEM PART NUMBER, Part Number, ORIGIN TYPE, Category, PURCHASE PRICE, Description, Stock Quantity, Min Stock, Unit</li>
                <li><strong>Pricing (optional):</strong> GST Rate Input (%), Sale Price Pre GST, GST Rate Output (%)</li>
                <li><strong>Labour (optional):</strong> Associated Labour Name, Work Time, Labour Rate, Labour GST Rate (%)</li>
                <li><strong>Note:</strong> Stock Quantity defaults to 0 if not specified</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex-1"
              >
                <Download size={18} className="mr-2" />
                Download Template
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx, .xls, .csv)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {uploadFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileSpreadsheet size={18} />
                    <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {uploadProgress && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Upload Results:</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      Success: {uploadProgress.success}
                    </span>
                    {uploadProgress.merged && uploadProgress.merged > 0 && (
                      <span className="text-blue-600 font-medium">
                        Merged: {uploadProgress.merged}
                      </span>
                    )}
                    <span className="text-red-600 font-medium">
                      Failed: {uploadProgress.failed}
                    </span>
                  </div>
                </div>
                {uploadProgress.errors.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                      {uploadProgress.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {uploadProgress.errors.length > 10 && (
                        <li>... and {uploadProgress.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleExcelUpload}
                disabled={!uploadFile}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <Upload size={18} className="mr-2" />
                Upload Parts
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadProgress(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
