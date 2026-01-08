import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { CreateJobCardForm, JobCardPart2Item } from "@/features/job-cards/types/job-card.types";
import { apiClient } from "@/core/api/client";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import type { Part } from "@/features/inventory/types/inventory.types";
import { useRole } from "@/shared/hooks";

interface RequestedPartsSectionProps {
    form: CreateJobCardForm;
    updateField: <K extends keyof CreateJobCardForm>(field: K, value: CreateJobCardForm[K]) => void;
    onError?: (message: string) => void;
}

export const RequestedPartsSection: React.FC<RequestedPartsSectionProps> = ({
    form,
    updateField,
    onError,
}) => {
    // Role-based access control - only service technicians can request parts
    const { userRole } = useRole();
    const isTechnician = userRole === "service_engineer";

    const [newItem, setNewItem] = useState<Partial<JobCardPart2Item>>({
        partName: "",
        partCode: "",
        qty: 1,
        amount: 0,
        itemType: "part",
    });

    // Search state
    const [allParts, setAllParts] = useState<Part[]>([]);
    const [searchResults, setSearchResults] = useState<Part[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch all parts once when component mounts
    useEffect(() => {
        const fetchAllParts = async () => {
            try {
                const response = await apiClient.get<Part[]>('/inventory', { cache: false });
                setAllParts(response.data || []);
            } catch (error) {
                console.error("Error fetching parts:", error);
                setAllParts([]);
            }
        };
        fetchAllParts();
    }, []);

    // Handle part search
    useEffect(() => {
        const query = newItem.partName;
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const filtered = allParts.filter(
            (part) =>
                part.partName?.toLowerCase().includes(normalizedQuery) ||
                part.partNumber?.toLowerCase().includes(normalizedQuery) ||
                part.partId?.toLowerCase().includes(normalizedQuery)
        );

        setSearchResults(filtered.slice(0, 10));
        setShowResults(true);
    }, [newItem.partName, allParts]);

    const handleSelectPart = (part: any) => {
        setNewItem(prev => ({
            ...prev,
            partName: part.partName,
            partCode: part.partNumber || part.partCode || "",
            amount: part.unitPrice || part.price || 0,
        }));
        setShowResults(false);
    };

    const handleAddItem = () => {
        if (!newItem.partName || !newItem.partCode) {
            onError?.("Please enter Part Name and Part Code.");
            return;
        }

        const item: JobCardPart2Item = {
            srNo: (form.requestedParts?.length || 0) + 1,
            partWarrantyTag: false,
            partName: newItem.partName || "",
            partCode: newItem.partCode || "",
            qty: newItem.qty || 1,
            amount: newItem.amount || 0,
            technician: "", // Not assigned yet
            labourCode: "Auto Select With Part",
            itemType: "part",
        };

        const updatedItems = [...(form.requestedParts || []), item];
        updateField('requestedParts', updatedItems);

        // Reset
        setNewItem({
            partName: "",
            partCode: "",
            qty: 1,
            amount: 0,
            itemType: "part",
        });
    };

    const handleDelete = async (index: number) => {
        const itemToDelete = form.requestedParts![index] as any;

        // If it has an ID or requestId, it's an existing request in DB
        // The JobCardAdapter maps 'id' or 'requestId' if available, let's assume 'requestId' stores the parent Request ID
        // Note: The adapter for 'requestedParts' maps (from PartsRequests) -> items. 
        // We need the PARENT PartsRequest ID to cancel the whole request, OR we might want to delete individual items.
        // My backend endpoint 'deletePartsRequest' takes a Request ID and deletes the whole request.
        // The current UI shows items flat.
        // If "Request Parts" created a SINGLE request for multiple items, we have to be careful.
        // But typically engineers request parts in batches. 
        // Let's assume for now we can delete if we have a request ID.

        // Check if we have a request ID on the item (adapter might need to pass it)
        const requestId = itemToDelete.requestId || (itemToDelete as any).id; // Check adapter mapping

        if (requestId) {
            if (!confirm("Are you sure you want to cancel this parts request?")) return;
            try {
                await jobCardService.deletePartsRequest(requestId);
                // Remove from local state
                const updatedItems = (form.requestedParts || []).filter((_, i) => i !== index).map((item, i) => ({ ...item, srNo: i + 1 }));
                updateField('requestedParts', updatedItems);
                if (typeof window !== 'undefined') window.location.reload(); // Refresh to ensure sync
            } catch (error) {
                console.error("Failed to delete parts request:", error);
                onError?.("Failed to cancel parts request. It may have been approved already.");
            }
        } else {
            // Local only
            const updatedItems = (form.requestedParts || []).filter((_, i) => i !== index).map((item, i) => ({ ...item, srNo: i + 1 }));
            updateField('requestedParts', updatedItems);
        }
    };



    // Access Control Logic:
    // 1. Service Technician: Can see section, Add parts, View list (Full Access)
    // 2. Others: Can only SEE the list if parts exist (Read Only), cannot Add/Request
    const hasRequestedParts = form.requestedParts && form.requestedParts.length > 0;

    if (!isTechnician && !hasRequestedParts) {
        return null;
    }

    return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">R</span>
                Requested Parts
            </h3>

            {isTechnician && (
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Add Part Request
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
                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Search part..."
                                autoComplete="off"
                            />
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    <ul>
                                        {searchResults.map((part: Part) => (
                                            <li
                                                key={part.id}
                                                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                                onMouseDown={() => handleSelectPart(part)}
                                            >
                                                <div className="font-medium text-gray-800">{part.partName}</div>
                                                <div className="text-xs text-gray-500">Code: {part.partNumber || part.partId}</div>
                                            </li>
                                        ))}
                                    </ul>
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                                readOnly
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

                        {/* Add Button */}
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">SR</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Part Name</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Part Code</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">QTY</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                                {isTechnician && <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(!form.requestedParts || form.requestedParts.length === 0) ? (
                                <tr>
                                    <td colSpan={isTechnician ? 6 : 5} className="px-3 py-8 text-center text-gray-500">
                                        No parts requested yet.
                                    </td>
                                </tr>
                            ) : (
                                form.requestedParts.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-700">{item.srNo}</td>
                                        <td className="px-3 py-2 text-gray-700">{item.partName}</td>
                                        <td className="px-3 py-2 text-gray-700 font-mono text-xs">{item.partCode}</td>
                                        <td className="px-3 py-2 text-gray-700">{item.qty}</td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                                                <Package size={12} />
                                                Sending Parts
                                            </span>
                                        </td>
                                        {isTechnician && (
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(index)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
