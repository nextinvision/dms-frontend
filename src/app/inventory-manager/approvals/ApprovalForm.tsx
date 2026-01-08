"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle } from "lucide-react";
import type { ApprovalFormData } from "./form.schema";
import { LABEL_CLASSES, INPUT_CLASSES, TEXTAREA_CLASSES, createFormChangeHandler } from "../shared/form.utils";

interface ApprovalFormProps {
  formData: ApprovalFormData;
  onFormChange: (data: ApprovalFormData) => void;
  approvalType: "sc_manager" | "inventory_manager";
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  parts: Array<{
    partId: string;
    partName: string;
    quantity: number;
    serialNumber?: string;
  }>;
}

export function ApprovalForm({
  formData,
  onFormChange,
  approvalType,
  onApprove,
  onReject,
  onCancel,
  isProcessing,
  disabled = false,
  parts,
}: ApprovalFormProps) {
  const handleChange = createFormChangeHandler(formData, onFormChange);
  const isInventoryManager = approvalType === "inventory_manager";
  const canApprove = isInventoryManager
    ? formData.assignedEngineer?.trim()
    : true;

  const handleQuantityChange = (partId: string, qty: number) => {
    onFormChange({
      ...formData,
      partQuantities: {
        ...formData.partQuantities,
        [partId]: qty
      }
    });
  };

  return (
    <div className="border-t pt-4 mt-4">
      {isInventoryManager && (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Part Quantities</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              {parts.map(part => (
                <div key={part.partId} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{part.partName}</span>
                    <span className="text-gray-500 text-xs">Requested: {part.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">Issue Qty:</label>
                    <input
                      type="number"
                      min="0"
                      max={part.quantity}
                      value={formData.partQuantities[part.partId] ?? part.quantity}
                      onChange={(e) => handleQuantityChange(part.partId, parseInt(e.target.value) || 0)}
                      className="w-20 p-1 border rounded text-right"
                      disabled={disabled}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className={`${LABEL_CLASSES} mb-2`}>
              Assign to Engineer *
            </label>
            <input
              type="text"
              value={formData.assignedEngineer || ""}
              onChange={(e) => handleChange("assignedEngineer", e.target.value)}
              placeholder="Enter engineer name"
              className={INPUT_CLASSES.replace("p-2", "p-3")}
              required
              disabled={disabled}
            />
          </div>
        </>
      )}

      <textarea
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="Add notes (optional)..."
        className={TEXTAREA_CLASSES + " mb-4"}
        rows={3}
        disabled={disabled}
      />

      <div className="flex gap-3">
        <Button
          onClick={onApprove}
          disabled={isProcessing || !canApprove || disabled}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle size={16} className="mr-2" />
          {isInventoryManager
            ? "Approve & Assign Parts as Inventory Manager"
            : "Approve as SC Manager"}
        </Button>
        <Button
          onClick={onReject}
          disabled={isProcessing || disabled}
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50"
        >
          <XCircle size={16} className="mr-2" />
          Reject
        </Button>
        <Button onClick={onCancel} variant="outline" disabled={disabled}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

