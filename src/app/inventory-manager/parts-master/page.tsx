"use client";
import { useState, useEffect } from "react";
import { partsMasterService } from "@/services/inventory/partsMaster.service";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PlusCircle, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { initializeInventoryMockData } from "@/__mocks__/data/inventory.mock";
import type { Part, PartFormData } from "@/shared/types/inventory.types";

export default function PartsMasterPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState<PartFormData>({
    partId: "",
    partName: "",
    partNumber: "",
    category: "",
    price: 0,
    description: "",
    minStockLevel: 0,
    unit: "piece",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await partsMasterService.update(editingPart.id, formData);
      } else {
        await partsMasterService.create(formData);
      }
      setShowModal(false);
      setEditingPart(null);
      setFormData({
        partId: "",
        partName: "",
        partNumber: "",
        category: "",
        price: 0,
        description: "",
        minStockLevel: 0,
        unit: "piece",
      });
      fetchParts();
    } catch (error) {
      console.error("Failed to save part:", error);
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      partId: part.partId,
      partName: part.partName,
      partNumber: part.partNumber,
      category: part.category,
      price: part.price,
      description: part.description || "",
      minStockLevel: part.minStockLevel,
      unit: part.unit,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this part?")) {
      try {
        await partsMasterService.delete(id);
        fetchParts();
      } catch (error) {
        console.error("Failed to delete part:", error);
      }
    }
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600">Parts Master</h1>
            <p className="text-gray-500 mt-1">Manage your parts catalog</p>
          </div>
          <Button
            onClick={() => {
              setEditingPart(null);
              setFormData({
                partId: "",
                partName: "",
                partNumber: "",
                category: "",
                price: 0,
                description: "",
                minStockLevel: 0,
                unit: "piece",
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <PlusCircle size={18} className="mr-2" />
            Add New Part
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading parts...</p>
          </div>
        ) : parts.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Parts Found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first part to the catalog.</p>
                <Button
                  onClick={() => {
                    setEditingPart(null);
                    setFormData({
                      partId: "",
                      partName: "",
                      partNumber: "",
                      category: "",
                      price: 0,
                      description: "",
                      minStockLevel: 0,
                      unit: "piece",
                    });
                    setShowModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <PlusCircle size={18} className="mr-2" />
                  Add First Part
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => {
              const isLowStock = part.stockQuantity < part.minStockLevel && part.stockQuantity > 0;
              const isOutOfStock = part.stockQuantity === 0;
              
              return (
                <div
                  key={part.id}
                  onClick={() => handleEdit(part)}
                  className="cursor-pointer"
                >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Package className={`mt-1 ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-indigo-600"}`} size={20} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{part.partName}</h3>
                          <p className="text-xs text-gray-500 mt-1">{part.partId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(part)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {(isLowStock || isOutOfStock) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {isOutOfStock ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <AlertTriangle size={14} />
                            Out of Stock
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <AlertTriangle size={14} />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Part Number:</span>
                        <span className="font-medium text-gray-900">{part.partNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-900">{part.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium text-gray-900">₹{part.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-gray-900"}`}>
                          {part.stockQuantity} {part.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Level:</span>
                        <span className="font-medium text-gray-900">{part.minStockLevel} {part.unit}</span>
                      </div>
                      {part.description && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 line-clamp-2">{part.description}</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingPart(null);
          }}
          title={editingPart ? "Edit Part" : "Add New Part"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part ID</label>
              <Input
                value={formData.partId}
                onChange={(e) => setFormData({ ...formData, partId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
              <Input
                value={formData.partName}
                onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <Input
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <Input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingPart ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingPart(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

