import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Upload, Eye } from 'lucide-react';
import { CreateJobCardForm, JobCardPart2Item } from "@/features/job-cards/types/job-card.types";
import { extractPartCode, extractPartName, extractLabourCode, generateSrNoForPart2Items } from "@/features/job-cards/utils/jobCardUtils";
import WarrantyDocumentationModal from "../modals/WarrantyDocumentationModal";

interface WarrantyDocumentationData {
    videoEvidence: string[];
    vinImage: string[];
    odoImage: string[];
    damageImages: string[];
    issueDescription: string;
    numberOfObservations: string;
    symptom: string;
    defectPart: string;
}

interface Part2ItemsSectionProps {
    form: CreateJobCardForm;
    updateField: <K extends keyof CreateJobCardForm>(field: K, value: CreateJobCardForm[K]) => void;
    onError?: (message: string) => void;
}

export const Part2ItemsSection: React.FC<Part2ItemsSectionProps> = ({
    form,
    updateField,
    onError,
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

    const handleFileUpload = (field: 'videoEvidence' | 'vinImage' | 'odoImage' | 'damageImages', files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        updateField(field, {
            files: [...form[field].files, ...newFiles],
            urls: form[field].urls,
        });
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
                    {/* Part Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Part Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newItem.partName || ""}
                            onChange={(e) => setNewItem({ ...newItem, partName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g., Front Fender"
                        />
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
                        <select
                            value={newItem.itemType || "part"}
                            onChange={(e) => {
                                const itemType = e.target.value as "part" | "work_item";
                                setNewItem({
                                    ...newItem,
                                    itemType,
                                    labourCode: itemType === "part" ? "Auto Select With Part" : "",
                                });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="part">Part</option>
                            <option value="work_item">Work Item</option>
                        </select>
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
                            onChange={(e) => setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })}
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
                                    technician: "",
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
                                        <td className="px-3 py-2 text-gray-700">₹{item.amount.toLocaleString("en-IN")}</td>
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
            {showWarrantyModal && selectedItemIndex !== null && (
                <WarrantyDocumentationModal
                    open={showWarrantyModal}
                    onClose={() => {
                        setShowWarrantyModal(false);
                        setSelectedItemIndex(null);
                    }}
                    itemDescription={form.part2Items[selectedItemIndex]?.partName || ""}
                    initialData={warrantyDocuments[selectedItemIndex]}
                    onSave={(data) => {
                        setWarrantyDocuments(prev => ({
                            ...prev,
                            [selectedItemIndex]: data
                        }));
                    }}
                    mode={warrantyModalMode}
                />
            )}
        </div>
    );
};
