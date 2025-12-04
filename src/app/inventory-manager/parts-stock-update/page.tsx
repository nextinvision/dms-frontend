"use client";
import { useState, useEffect } from "react";
import { partsMasterService } from "@/services/inventory/partsMaster.service";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Package, Plus, Minus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { initializeInventoryMockData } from "@/__mocks__/data/inventory.mock";
import type { Part } from "@/shared/types/inventory.types";

export default function PartsStockUpdatePage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [updateType, setUpdateType] = useState<"increase" | "decrease">("increase");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeInventoryMockData();
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setIsLoading(true);
      const data = await partsMasterService.getAll();
      setParts(data);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPart || !quantity || !reason) return;

    try {
      const qty = parseInt(quantity);
      const newStock = updateType === "increase" 
        ? selectedPart.stockQuantity + qty 
        : selectedPart.stockQuantity - qty;

      if (newStock < 0) {
        alert("Stock cannot be negative");
        return;
      }

      await partsMasterService.updateStock(
        selectedPart.id,
        qty,
        updateType === "increase" ? "add" : "subtract"
      );

      alert(`Stock ${updateType === "increase" ? "increased" : "decreased"} successfully!`);
      setSelectedPart(null);
      setQuantity("");
      setReason("");
      fetchParts();
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert("Failed to update stock");
    }
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Stock Update</h1>
          <p className="text-gray-500 mt-1">Increase or decrease stock levels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Select Part</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => setSelectedPart(part)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPart?.id === part.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{part.partName}</p>
                        <p className="text-sm text-gray-600">{part.partId} | Stock: {part.stockQuantity}</p>
                      </div>
                      <Package className="text-indigo-600" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Update Stock</h2>
            </CardHeader>
            <CardBody>
              {selectedPart ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="font-semibold text-gray-900 mb-2">{selectedPart.partName}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Part ID:</p>
                        <p className="font-medium text-gray-900">{selectedPart.partId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Category:</p>
                        <p className="font-medium text-gray-900">{selectedPart.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Stock:</p>
                        <p className={`font-bold text-lg ${selectedPart.stockQuantity < selectedPart.minStockLevel ? "text-orange-600" : "text-gray-900"}`}>
                          {selectedPart.stockQuantity} {selectedPart.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Min Level:</p>
                        <p className="font-medium text-gray-900">{selectedPart.minStockLevel} {selectedPart.unit}</p>
                      </div>
                    </div>
                    {selectedPart.stockQuantity < selectedPart.minStockLevel && (
                      <Badge variant="warning" className="mt-2">
                        <AlertTriangle size={12} className="mr-1" />
                        Low Stock Warning
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUpdateType("increase");
                          setQuantity("");
                        }}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          updateType === "increase"
                            ? "border-green-500 bg-green-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <TrendingUp className={`mx-auto mb-2 ${updateType === "increase" ? "text-green-600" : "text-gray-400"}`} size={24} />
                        <span className={`text-sm font-medium block ${updateType === "increase" ? "text-green-700" : "text-gray-600"}`}>Increase</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUpdateType("decrease");
                          setQuantity("");
                        }}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          updateType === "decrease"
                            ? "border-red-500 bg-red-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <TrendingDown className={`mx-auto mb-2 ${updateType === "decrease" ? "text-red-600" : "text-gray-400"}`} size={24} />
                        <span className={`text-sm font-medium block ${updateType === "decrease" ? "text-red-700" : "text-gray-600"}`}>Decrease</span>
                      </button>
                    </div>
                  </div>

                  {quantity && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">New Stock Will Be:</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {updateType === "increase"
                          ? selectedPart.stockQuantity + parseInt(quantity || "0")
                          : Math.max(0, selectedPart.stockQuantity - parseInt(quantity || "0"))}{" "}
                        {selectedPart.unit}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason for stock update..."
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      required
                    />
                  </div>

                  <Button
                    onClick={handleUpdate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Update Stock
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a part to update stock
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

