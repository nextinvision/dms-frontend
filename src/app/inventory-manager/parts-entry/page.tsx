"use client";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PlusCircle, Trash2, FileText, Calendar, Building2, Upload, Download, FileSpreadsheet, X } from "lucide-react";
import * as XLSX from "xlsx";
import { partsEntryService, type PartsEntry } from "@/features/inventory/services/partsEntry.service";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import type { Part } from "@/shared/types/inventory.types";
import { PartsEntryForm } from "./PartsEntryForm";
import { getInitialFormData, getInitialItemFormData, type PartsEntryFormData, type PartsEntryItemFormData } from "./form.schema";

interface PartsEntryItem {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export default function PartsEntryPage() {
  const [activeTab, setActiveTab] = useState<"manual" | "bulk">("manual");
  const [formData, setFormData] = useState<PartsEntryFormData>(getInitialFormData());
  const [parts, setParts] = useState<PartsEntryItem[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [recentEntries, setRecentEntries] = useState<PartsEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPart, setCurrentPart] = useState<PartsEntryItemFormData>(getInitialItemFormData());
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  useEffect(() => {

    fetchAvailableParts();
    fetchRecentEntries();
  }, []);

  const fetchAvailableParts = async () => {
    try {
      const data = await partsMasterService.getAll();
      setAvailableParts(data);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
    }
  };

  const fetchRecentEntries = async () => {
    try {
      const entries = await partsEntryService.getRecent(10);
      setRecentEntries(entries);
    } catch (error) {
      console.error("Failed to fetch recent entries:", error);
    }
  };

  const handlePartSelect = (partId: string) => {
    const part = availableParts.find((p) => p.id === partId);
    if (part) {
      setCurrentPart({
        partId: part.id,
        partName: part.partName,
        quantity: "",
        unitPrice: part.price.toString(),
      });
    } else {
      setCurrentPart(getInitialItemFormData());
    }
  };

  const addPart = () => {
    if (!currentPart.partId || !currentPart.partName || !currentPart.quantity || !currentPart.unitPrice) {
      alert("Please fill all fields");
      return;
    }

    // Check if part already added
    if (parts.find((p) => p.partId === currentPart.partId)) {
      alert("This part is already added to the entry");
      return;
    }

    setParts([
      ...parts,
      {
        partId: currentPart.partId,
        partName: currentPart.partName,
        quantity: parseInt(currentPart.quantity),
        unitPrice: parseFloat(currentPart.unitPrice),
      },
    ]);

    setCurrentPart(getInitialItemFormData());
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const totalAmount = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

  const handleSubmit = async () => {
    if (!formData.invoiceNumber || !formData.vendor || parts.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await partsEntryService.create(
        formData.invoiceNumber,
        formData.vendor,
        formData.entryDate,
        parts,
        "Inventory Manager"
      );

      alert("Parts entry saved successfully! Stock has been updated.");
      setFormData(getInitialFormData());
      setParts([]);
      setCurrentPart(getInitialItemFormData());
      setUploadFile(null);
      setUploadErrors([]);
      fetchRecentEntries();
      fetchAvailableParts(); // Refresh to show updated stock
    } catch (error) {
      console.error("Failed to save parts entry:", error);
      alert("Failed to save parts entry. Please try again.");
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
    setUploadErrors([]);
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;

    try {
      const fileData = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

      const errors: string[] = [];
      const uploadedParts: PartsEntryItem[] = [];
      let vendorName = "";

      // Helper function to get value from row (case-insensitive)
      const getValue = (row: any, keys: string[]): string => {
        for (const key of keys) {
          const found = Object.keys(row).find(
            (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
          );
          if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
            return String(row[found]).trim();
          }
        }
        return "";
      };

      // Helper function to parse number
      const parseNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const cleaned = val.replace(/[₹,\s]/g, '').trim();
          return parseFloat(cleaned) || 0;
        }
        return 0;
      };

      // Extract vendor name from first non-empty row (if present)
      for (const row of jsonData) {
        vendorName = getValue(row, ["Vendor Name", "VendorName", "vendor_name", "Vendor", "vendor"]);
        if (vendorName) {
          break; // Use the first non-empty vendor name found
        }
      }
      
      // Auto-fill vendor field if found in file and form field is empty
      if (vendorName && !formData.vendor) {
        setFormData({ ...formData, vendor: vendorName });
      }

      // Process each row
      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // +2 because Excel rows start at 1 and we have header

        // Try to find part by ID or Name
        const partId = getValue(row, ["Part ID", "PartId", "part_id", "PartId"]);
        const partName = getValue(row, ["Part Name", "PartName", "part_name", "Name"]);
        const quantity = parseNumber(getValue(row, ["Quantity", "quantity", "Qty", "qty"]));
        const unitPrice = parseNumber(getValue(row, ["Unit Price", "UnitPrice", "unit_price", "Price", "price"]));

        // Validate required fields
        if (!partId && !partName) {
          errors.push(`Row ${rowNum}: Part ID or Part Name is required`);
          return;
        }

        if (!quantity || quantity <= 0) {
          errors.push(`Row ${rowNum}: Valid quantity is required`);
          return;
        }

        if (!unitPrice || unitPrice <= 0) {
          errors.push(`Row ${rowNum}: Valid unit price is required`);
          return;
        }

        // Find the part in available parts
        let part: Part | undefined;
        if (partId) {
          part = availableParts.find((p) => p.id === partId || p.partId === partId);
        }
        if (!part && partName) {
          part = availableParts.find((p) => 
            p.partName.toLowerCase() === partName.toLowerCase() ||
            p.partName.toLowerCase().includes(partName.toLowerCase())
          );
        }

        if (!part) {
          errors.push(`Row ${rowNum}: Part not found - ${partName || partId}`);
          return;
        }

        // Check if part already added
        if (uploadedParts.find((p) => p.partId === part!.id)) {
          errors.push(`Row ${rowNum}: Part "${part.partName}" is already in the list`);
          return;
        }

        uploadedParts.push({
          partId: part.id,
          partName: part.partName,
          quantity: quantity,
          unitPrice: unitPrice,
        });
      });

      setUploadErrors(errors);

      if (uploadedParts.length > 0) {
        // Add uploaded parts to the existing list (or replace if list is empty)
        if (parts.length === 0) {
          setParts(uploadedParts);
        } else {
          // Merge with existing parts, avoiding duplicates
          const mergedParts = [...parts];
          uploadedParts.forEach((newPart) => {
            if (!mergedParts.find((p) => p.partId === newPart.partId)) {
              mergedParts.push(newPart);
            }
          });
          setParts(mergedParts);
        }
        
        if (errors.length === 0) {
          alert(`Successfully imported ${uploadedParts.length} part(s)!`);
          setUploadFile(null);
        } else {
          alert(`Imported ${uploadedParts.length} part(s) with ${errors.length} error(s). Please check the errors below.`);
        }
      } else {
        alert("No valid parts found in the file. Please check the format and try again.");
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to process file. Please check the format and try again.");
      setUploadErrors(["Failed to process file"]);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Vendor Name": "Sample Vendor",
        "Part ID": "PART001",
        "Part Name": "Sample Part Name",
        "Quantity": 10,
        "Unit Price": 100.50,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parts Entry");
    XLSX.writeFile(wb, "parts_entry_template.xlsx");
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Parts Entry</h1>
          <p className="text-gray-500 mt-1">Record incoming parts stock</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Entry Details</h2>
              </CardHeader>
              <CardBody>
                <PartsEntryForm formData={formData} onFormChange={setFormData} />
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Add Parts</h2>
                  {/* Tabs */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("manual")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        activeTab === "manual"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      onClick={() => setActiveTab("bulk")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        activeTab === "bulk"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Bulk Upload
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {activeTab === "manual" ? (
                  <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Part</label>
                  <select
                    value={currentPart.partId}
                    onChange={(e) => handlePartSelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-3"
                  >
                    <option value="">Select a part...</option>
                    {availableParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.partName} ({part.partId}) - Current Stock: {part.stockQuantity} {part.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {currentPart.partId && (
                  <div className="p-3 bg-indigo-50 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-900">{currentPart.partName}</p>
                    <p className="text-xs text-gray-600">Price: ₹{currentPart.unitPrice}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Input
                    type="number"
                    value={currentPart.quantity}
                    onChange={(e) => setCurrentPart({ ...currentPart, quantity: e.target.value })}
                    placeholder="Quantity *"
                    min="1"
                    disabled={!currentPart.partId}
                  />
                  <Input
                    type="number"
                    value={currentPart.unitPrice}
                    onChange={(e) => setCurrentPart({ ...currentPart, unitPrice: e.target.value })}
                    placeholder="Unit Price *"
                    min="0"
                    step="0.01"
                  />
                  <Button
                    onClick={addPart}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!currentPart.partId || !currentPart.quantity || !currentPart.unitPrice}
                  >
                    <PlusCircle size={18} className="mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {parts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{part.partName}</p>
                        <p className="text-sm text-gray-600">
                          ID: {part.partId} | Qty: {part.quantity} | Price: ₹{part.unitPrice} | Total: ₹{part.quantity * part.unitPrice}
                        </p>
                      </div>
                      <button
                        onClick={() => removePart(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Excel/CSV File Format</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Your file should have the following columns:
                      </p>
                      <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                        <li><strong>Vendor Name</strong> (optional) - Will auto-fill the vendor field if provided</li>
                        <li><strong>Part ID</strong> or <strong>Part Name</strong> (required) - Must match existing parts in the system</li>
                        <li><strong>Quantity</strong> (required) - Number of parts</li>
                        <li><strong>Unit Price</strong> (required) - Price per unit</li>
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
                        Select Excel/CSV File (.xlsx, .xls, .csv)
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

                    {uploadErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-red-900">Upload Errors:</span>
                          <span className="text-sm text-red-600">{uploadErrors.length} error(s)</span>
                        </div>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                            {uploadErrors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                            {uploadErrors.length > 10 && (
                              <li>... and {uploadErrors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleBulkUpload}
                      disabled={!uploadFile}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Upload size={18} className="mr-2" />
                      Import Parts
                    </Button>

                    {parts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Imported Parts ({parts.length})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {parts.map((part, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{part.partName}</p>
                                <p className="text-sm text-gray-600">
                                  ID: {part.partId} | Qty: {part.quantity} | Price: ₹{part.unitPrice} | Total: ₹{part.quantity * part.unitPrice}
                                </p>
                              </div>
                              <button
                                onClick={() => removePart(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Parts</p>
                    <p className="text-2xl font-bold text-gray-900">{parts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-indigo-600">₹{totalAmount.toLocaleString()}</p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6"
                    disabled={parts.length === 0}
                  >
                    Save Entry
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Recent Entries */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Entries</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm"
                  >
                    {showHistory ? "Hide" : "Show"} History
                  </Button>
                </div>
              </CardHeader>
              {showHistory && (
                <CardBody>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentEntries.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No recent entries</p>
                    ) : (
                      recentEntries.map((entry) => (
                        <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FileText size={16} className="text-indigo-600" />
                                <span className="font-semibold text-gray-900">Invoice: {entry.invoiceNumber}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Building2 size={14} />
                                  <span>{entry.vendor}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{new Date(entry.entryDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="success">₹{entry.totalAmount.toLocaleString()}</Badge>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Parts ({entry.parts.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.parts.map((part, idx) => (
                                <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                  {part.partName} (Qty: {part.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

