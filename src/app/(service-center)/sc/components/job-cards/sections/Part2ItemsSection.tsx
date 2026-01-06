import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { CreateJobCardForm, JobCardPart2Item } from "@/features/job-cards/types/job-card.types";
import { extractPartCode, extractPartName, extractLabourCode, generateSrNoForPart2Items } from "@/features/job-cards/utils/jobCardUtils";
import WarrantyDocumentationModal from "../modals/WarrantyDocumentationModal";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { CLOUDINARY_FOLDERS } from "@/services/cloudinary/folderStructure";
import { saveFileMetadata } from "@/services/files/fileMetadata.service";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { apiClient } from "@/core/api/client";
import type { Part } from "@/features/inventory/types/inventory.types";

import { FileMetadata, FileCategory, RelatedEntityType } from "@/services/cloudinary/fileMetadata.service";

interface WarrantyDocumentationData {
    videoEvidence: string[];
    vinImage: string[];
    odoImage: string[];
    damageImages: string[];
    issueDescription: string;
    numberOfObservations: string;
    symptom: string;
    defectPart: string;
    fileMetadata?: Record<string, FileMetadata[]>;
}

interface Part2ItemsSectionProps {
    form: CreateJobCardForm;
    updateField: <K extends keyof CreateJobCardForm>(field: K, value: CreateJobCardForm[K]) => void;
    onError?: (message: string) => void;
    jobCardId?: string;
    userId?: string;
    onPassToManager?: () => void;
    isPassedToManager?: boolean;
    isSubmitting?: boolean;
    hasQuotation?: boolean;
}

export const Part2ItemsSection: React.FC<Part2ItemsSectionProps> = ({
    form,
    updateField,
    onError,
    jobCardId: propJobCardId,
    userId,
    onPassToManager,
    isPassedToManager,
    isSubmitting,
    hasQuotation,
}) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newItem, setNewItem] = useState<Partial<JobCardPart2Item>>({
        partWarrantyTag: false,
        partName: "",
        partCode: "",
        qty: 1,
        amount: 0,
        technician: "",
        labourCode: "",
        itemType: "part",
    });

    // Warranty documentation modal state
    const [showWarrantyModal, setShowWarrantyModal] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [warrantyModalMode, setWarrantyModalMode] = useState<"upload" | "view">("upload");

    // Store warranty documentation for each item by index
    const [warrantyDocuments, setWarrantyDocuments] = useState<Record<number, WarrantyDocumentationData>>({});
    const jobCardId = propJobCardId || form.vehicleId || "temp";

    // Search state
    const [allParts, setAllParts] = useState<Part[]>([]);
    const [searchResults, setSearchResults] = useState<Part[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [partsLoaded, setPartsLoaded] = useState(false);

    // Fetch all parts once when component mounts
    useEffect(() => {
        const fetchAllParts = async () => {
            try {
                const response = await apiClient.get<Part[]>('/inventory', {
                    cache: false,
                });
                setAllParts(response.data || []);
                setPartsLoaded(true);
            } catch (error) {
                console.error("Error fetching parts:", error);
                setAllParts([]);
                setPartsLoaded(true);
            }
        };

        fetchAllParts();
    }, []);

    // Handle part search - filter locally from allParts
    // Handle part search - filter locally from allParts
    useEffect(() => {
        const query = newItem.partName;

        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        // Filter locally from already fetched parts
        const normalizedQuery = query.toLowerCase().trim();
        const filtered = allParts.filter(
            (part) =>
                part.partName?.toLowerCase().includes(normalizedQuery) ||
                part.partNumber?.toLowerCase().includes(normalizedQuery) ||
                part.partId?.toLowerCase().includes(normalizedQuery)
        );

        setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
        setShowResults(true);
    }, [newItem.partName, allParts]);

    // Hydrate warranty documents from form props on mount or when form changes meaningfully
    useEffect(() => {
        // Check if we have global warranty data in the form
        const hasGlobalWarrantyData =
            !!form.issueDescription ||
            (form.videoEvidence?.urls && form.videoEvidence.urls.length > 0) ||
            (form.vinImage?.urls && form.vinImage.urls.length > 0);

        if (hasGlobalWarrantyData && form.part2Items.length > 0) {
            // Construct the data object from global form fields
            const globalDocs: WarrantyDocumentationData = {
                videoEvidence: form.videoEvidence?.urls || [],
                vinImage: form.vinImage?.urls || [],
                odoImage: form.odoImage?.urls || [],
                damageImages: form.damageImages?.urls || [],
                issueDescription: form.issueDescription || "",
                numberOfObservations: form.numberOfObservations || "",
                symptom: form.symptom || "",
                defectPart: form.defectPart || "",
                // Re-construct metadata if available
                fileMetadata: {
                    videoEvidence: (form.videoEvidence?.metadata || []).map(m => ({
                        id: m.fileId,
                        url: m.url,
                        publicId: m.publicId,
                        filename: m.filename,
                        format: m.format,
                        bytes: m.bytes,
                        category: FileCategory.WARRANTY_VIDEO,
                        relatedEntityId: jobCardId,
                        relatedEntityType: RelatedEntityType.JOB_CARD,
                        metadata: { uploadedAt: m.uploadedAt }
                    })),
                    vinImage: (form.vinImage?.metadata || []).map(m => ({
                        id: m.fileId,
                        url: m.url,
                        publicId: m.publicId,
                        filename: m.filename,
                        format: m.format,
                        bytes: m.bytes,
                        category: FileCategory.WARRANTY_VIN,
                        relatedEntityId: jobCardId,
                        relatedEntityType: RelatedEntityType.JOB_CARD,
                        metadata: { uploadedAt: m.uploadedAt }
                    })),
                    odoImage: (form.odoImage?.metadata || []).map(m => ({
                        id: m.fileId,
                        url: m.url,
                        publicId: m.publicId,
                        filename: m.filename,
                        format: m.format,
                        bytes: m.bytes,
                        category: FileCategory.WARRANTY_ODO,
                        relatedEntityId: jobCardId,
                        relatedEntityType: RelatedEntityType.JOB_CARD,
                        metadata: { uploadedAt: m.uploadedAt }
                    })),
                    damageImages: (form.damageImages?.metadata || []).map(m => ({
                        id: m.fileId,
                        url: m.url,
                        publicId: m.publicId,
                        filename: m.filename,
                        format: m.format,
                        bytes: m.bytes,
                        category: FileCategory.WARRANTY_DAMAGE,
                        relatedEntityId: jobCardId,
                        relatedEntityType: RelatedEntityType.JOB_CARD,
                        metadata: { uploadedAt: m.uploadedAt }
                    })),
                }
            };

            // Heuristic to find which item this data belongs to
            let targetIndex = -1;

            // 1. Try to match by defect part name
            if (form.defectPart) {
                targetIndex = form.part2Items.findIndex(item =>
                    item.partName.toLowerCase() === form.defectPart.toLowerCase()
                );
            }

            // 2. If no match or no defect part, default to first item with warranty tag
            if (targetIndex === -1) {
                targetIndex = form.part2Items.findIndex(item => item.partWarrantyTag);
            }

            // 3. If still nothing found but we have data, fallback to first item
            if (targetIndex === -1 && form.part2Items.length > 0) {
                targetIndex = 0;
            }

            if (targetIndex !== -1) {
                setWarrantyDocuments(prev => ({
                    ...prev,
                    [targetIndex]: globalDocs
                }));
            }
        }
    }, [
        // Only trigger on specific field changes to avoid loops, 
        // though typically this should stabilize quickly
        form.issueDescription,
        form.videoEvidence?.urls, // Check reference equality of arrays
        form.defectPart,
        // We include part2Items length to retry if items are loaded later
        form.part2Items.length,
        jobCardId
        // NOTE: purposefully excluding the whole form object or part2Items deep content to prevent loops
    ]);

    const handleSelectPart = (part: any) => {
        // Map backend partType to frontend itemType
        const lowerPartType = part.partType?.toLowerCase() || "";

        // Check for various indicators of a work item/service based ONLY on partType
        const isWorkItem =
            lowerPartType === "work item" ||
            lowerPartType === "work_item" ||
            lowerPartType === "service" ||
            lowerPartType === "labour";

        const itemType = isWorkItem ? "work_item" : "part";
        setNewItem(prev => ({
            ...prev,
            partName: part.partName,
            partCode: part.partNumber || part.partCode || "",
            rate: part.unitPrice || part.price || 0,
            gstPercent: part.gstRate || 18,
            amount: part.totalPrice || (part.unitPrice ? part.unitPrice * (1 + (part.gstRate || 18) / 100) : part.price || 0),
            labourCode: part.labourCode || prev.labourCode || "",
            itemType,
        }));
        setShowResults(false);
    };


    const handleSaveWarrantyDoc = (index: number, data: WarrantyDocumentationData) => {
        // 1. Update local state for this item
        setWarrantyDocuments(prev => ({
            ...prev,
            [index]: data
        }));

        // 2. Sync Case Details with top-level form fields for submission
        updateField('issueDescription', data.issueDescription || "");
        updateField('numberOfObservations', data.numberOfObservations || "");
        updateField('symptom', data.symptom || "");
        updateField('defectPart', data.defectPart || "");

        // 3. Sync Files with top-level form fields
        if (data.fileMetadata) {
            const mapToDocumentationFiles = (field: string) => {
                const metadatas = (data.fileMetadata as any)[field] || [];
                if (metadatas.length === 0) return { urls: [], publicIds: [], metadata: [] };

                return {
                    urls: metadatas.map((m: any) => m.url),
                    publicIds: metadatas.map((m: any) => m.publicId),
                    metadata: metadatas.map((m: any) => ({
                        url: m.url,
                        publicId: m.publicId,
                        filename: m.filename,
                        format: m.format,
                        bytes: m.bytes,
                        fileId: m.id || "",
                        uploadedAt: new Date().toISOString()
                    }))
                };
            };

            updateField('videoEvidence', mapToDocumentationFiles('videoEvidence'));
            updateField('vinImage', mapToDocumentationFiles('vinImage'));
            updateField('odoImage', mapToDocumentationFiles('odoImage'));
            updateField('damageImages', mapToDocumentationFiles('damageImages'));
        }

        console.log(`✅ Synced warranty documentation for item ${index} to form`);
    };



    const handleAddOrUpdate = () => {
        if (!newItem.partName || !newItem.partCode) {
            onError?.("Please enter Part Name and Part Code.");
            return;
        }

        const item: JobCardPart2Item = {
            srNo: editingIndex !== null ? form.part2Items[editingIndex].srNo : form.part2Items.length + 1,
            partWarrantyTag: newItem.partWarrantyTag || false,
            partName: newItem.partName || "",
            partCode: newItem.partCode || "",
            qty: newItem.qty || 1,
            amount: newItem.amount || 0,
            technician: newItem.technician || "",
            labourCode: newItem.itemType === "work_item"
                ? (newItem.labourCode || extractLabourCode(newItem.partName || ""))
                : "Auto Select With Part",
            itemType: newItem.itemType || "part",
        };

        let updatedItems = [...form.part2Items];
        if (editingIndex !== null) {
            updatedItems[editingIndex] = item;
            setEditingIndex(null);
        } else {
            updatedItems.push(item);
        }

        updateField('part2Items', generateSrNoForPart2Items(updatedItems));

        // Reset
        setNewItem({
            partWarrantyTag: false,
            partName: "",
            partCode: "",
            qty: 1,
            amount: 0,
            technician: "",
            labourCode: "",
            itemType: "part",
        });
    };

    const handleEdit = (index: number) => {
        const item = form.part2Items[index];
        setNewItem({
            ...item,
        });
        setEditingIndex(index);
    };

    const handleDelete = (index: number) => {
        const updatedItems = form.part2Items.filter((_, i) => i !== index);
        updateField('part2Items', generateSrNoForPart2Items(updatedItems));
    };

    return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Parts & Work Items List
            </h3>

            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {editingIndex !== null ? "Edit Item" : "Add New Item"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Part Name with Search */}
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Part Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newItem.partName || ""}
                            onChange={(e) => {
                                setNewItem({ ...newItem, partName: e.target.value });
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => {
                                // Delay hiding results to allow click to register
                                setTimeout(() => setShowResults(false), 200);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Search part by name..."
                            autoComplete="off"
                        />
                        {/* Search Results Dropdown */}
                        {showResults && (searchResults.length > 0 || isSearching) && newItem.partName && newItem.partName.length >= 2 && (
                            <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-3 text-center text-gray-500 text-xs">Searching...</div>
                                ) : (
                                    <ul>
                                        {searchResults.map((part: Part) => (
                                            <li
                                                key={part.id}
                                                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                                onMouseDown={() => handleSelectPart(part)}
                                            >
                                                <div className="font-medium text-gray-800">{part.partName}</div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                    <span>Code: {part.partNumber || part.partId}</span>
                                                    <span>Stock: {part.stockQuantity}</span>
                                                </div>
                                                <div className="flex flex-col text-xs mt-0.5">
                                                    {(part.unitPrice || part.price) && (
                                                        <span className="text-gray-500">
                                                            Pre-GST: ₹{(part.unitPrice || part.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                    <span className="text-indigo-600 font-bold">
                                                        Total (Incl. GST): ₹{(part.totalPrice || (part.unitPrice ? part.unitPrice * (1 + (part.gstRate || 18) / 100) : part.price || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {part.labourCode && (
                                                        <span className="text-green-600">
                                                            Labour Code: {part.labourCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Part Code */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Part Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newItem.partCode || ""}
                            onChange={(e) => setNewItem({ ...newItem, partCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g., 2W0000000027_011"
                        />
                    </div>

                    {/* QTY */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            QTY <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={newItem.qty || 1}
                            onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 1 })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Labour Code */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Labour Code
                        </label>
                        <input
                            type="text"
                            value={newItem.labourCode || ""}
                            onChange={(e) => setNewItem({ ...newItem, labourCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={newItem.itemType === "part" ? "Auto Select With Part" : "Enter labour code"}
                            disabled={newItem.itemType === "part"}
                        />
                    </div>







                    {/* Part Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Part Type <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newItem.itemType === "work_item" ? "Work Item" : "Part"}
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newItem.amount || 0}
                            onChange={(e) => {
                                const total = parseFloat(e.target.value) || 0;
                                // Simple back-calculate pre-gst rate if possible, using 18% as fallback
                                const gst = newItem.gstPercent || 18;
                                const rate = total / (1 + (gst / 100));
                                setNewItem({ ...newItem, amount: total, rate });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Technician */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Technician
                        </label>
                        <input
                            type="text"
                            value={newItem.technician || ""}
                            onChange={(e) => setNewItem({ ...newItem, technician: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Assign technician"
                        />
                    </div>

                    {/* Under Warranty */}
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newItem.partWarrantyTag || false}
                                onChange={(e) => setNewItem({ ...newItem, partWarrantyTag: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-xs font-medium text-gray-700">Under Warranty</span>
                        </label>
                        {newItem.partWarrantyTag && (
                            <p className="text-xs text-amber-600 ml-2 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Documentation required</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        type="button"
                        onClick={handleAddOrUpdate}
                        className={`px-4 py-2 ${editingIndex !== null ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg text-sm font-medium transition inline-flex items-center gap-2`}
                    >
                        {editingIndex !== null ? 'Update Item' : <><Plus size={16} /> Add Item</>}
                    </button>
                    {editingIndex !== null && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingIndex(null);
                                setNewItem({
                                    partWarrantyTag: false,
                                    partName: "",
                                    partCode: "",
                                    qty: 1,
                                    amount: 0,
                                    // technician: "",
                                    labourCode: "",
                                    itemType: "part",
                                });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">SR NO</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Warranty Tag</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Part Name</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Part Code</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">QTY</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Amount</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Technician</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Documentation</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {form.part2Items.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                                        No items added yet. Add items using the form above.
                                    </td>
                                </tr>
                            ) : (
                                form.part2Items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-700 font-medium">{item.srNo}</td>
                                        <td className="px-3 py-2">
                                            {item.partWarrantyTag ? (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                    ✓ Warranty
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                    No Warranty
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{item.partName}</td>
                                        <td className="px-3 py-2 text-gray-700 font-mono text-xs">{item.partCode}</td>
                                        <td className="px-3 py-2 text-gray-700">{item.qty}</td>
                                        <td className="px-3 py-2 text-gray-700">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-gray-700">{item.technician || "-"}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.itemType === "part"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-purple-100 text-purple-700"
                                                }`}>
                                                {item.itemType === "part" ? "Part" : "Work Item"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.partWarrantyTag ? (
                                                <div className="flex gap-1">
                                                    {warrantyDocuments[index] ? (
                                                        <div className="flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedItemIndex(index);
                                                                    setWarrantyModalMode("view");
                                                                    setShowWarrantyModal(true);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition inline-flex items-center gap-1"
                                                                title="View Documentation"
                                                            >
                                                                <Eye size={12} />
                                                                View
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedItemIndex(index);
                                                                    setWarrantyModalMode("upload");
                                                                    setShowWarrantyModal(true);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition inline-flex items-center gap-1"
                                                                title="Edit Documentation"
                                                            >
                                                                <Edit2 size={12} />
                                                                Edit
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedItemIndex(index);
                                                                setWarrantyModalMode("upload");
                                                                setShowWarrantyModal(true);
                                                            }}
                                                            className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition inline-flex items-center gap-1"
                                                            title="Upload Documentation"
                                                        >
                                                            <Upload size={12} />
                                                            Upload
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(index)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(index)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warranty Documentation Modal */}
            {
                showWarrantyModal && selectedItemIndex !== null && (
                    <WarrantyDocumentationModal
                        open={showWarrantyModal}
                        onClose={() => {
                            setShowWarrantyModal(false);
                            setSelectedItemIndex(null);
                        }}
                        itemDescription={form.part2Items[selectedItemIndex]?.partName || ""}
                        initialData={warrantyDocuments[selectedItemIndex]}
                        onSave={(data) => handleSaveWarrantyDoc(selectedItemIndex, data)}
                        mode={warrantyModalMode}
                        jobCardId={propJobCardId || form.vehicleId || "temp"}
                        itemIndex={selectedItemIndex}
                        userId={userId}
                        customerId={form.customerId}
                        vehicleId={form.vehicleId}
                    />
                )
            }
            {/* Pass to Manager Action - Only if warranty parts exist */}
            {onPassToManager && form.part2Items.some(item => item.partWarrantyTag) && (
                <div className="mt-4 flex justify-end border-t border-gray-200 pt-4">
                    <button
                        type="button"
                        onClick={onPassToManager}
                        disabled={isSubmitting || hasQuotation}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-purple-100 disabled:opacity-50 disabled:cursor-not-allowed ${(isSubmitting || hasQuotation)
                            ? "bg-gray-100 text-gray-400 border border-gray-200"
                            : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90"
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ArrowRight size={16} />
                                {isPassedToManager ? "Resend to Manager" : "Pass to Manager"}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div >
    );
};
