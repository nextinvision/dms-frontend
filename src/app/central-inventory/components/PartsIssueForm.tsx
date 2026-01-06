"use client";
import { useState, useEffect } from "react";
import { PlusCircle, MinusCircle, X, Package, CheckCircle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type {
  CentralStock,
  ServiceCenterInfo,
  PartsIssueFormData,
  PurchaseOrder,
} from "@/shared/types/central-inventory.types";

interface IssueItem {
  partId: string;
  partName: string;
  partNumber?: string;
  hsnCode: string;
  fromStock: string;
  quantity: number;
  unitPrice: number;
  availableQty: number;
}

interface PartsIssueFormProps {
  serviceCenter: ServiceCenterInfo;
  availableStock: CentralStock[];
  availablePurchaseOrders?: PurchaseOrder[];
  initialItems?: IssueItem[];
  initialPurchaseOrderId?: string;
  onSubmit: (formData: PartsIssueFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PartsIssueForm({
  serviceCenter,
  availableStock,
  availablePurchaseOrders = [],
  initialItems = [],
  initialPurchaseOrderId,
  onSubmit,
  onCancel,
  isLoading = false,
}: PartsIssueFormProps) {
  const [issueItems, setIssueItems] = useState<IssueItem[]>(initialItems);
  const [selectedPart, setSelectedPart] = useState<CentralStock | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState(initialPurchaseOrderId || "");
  const [notes, setNotes] = useState("");
  const [transportDetails, setTransportDetails] = useState({
    transporter: "",
    trackingNumber: "",
    expectedDelivery: "",
  });

  // Update items when initialItems change
  useEffect(() => {
    if (initialItems.length > 0) {
      setIssueItems(initialItems);
    }
  }, [initialItems]);

  const handleAddItem = () => {
    if (!selectedPart || quantity <= 0) {
      alert("Please select a part and enter a valid quantity");
      return;
    }

    // Calculate actual available stock (accounting for allocated quantities)
    const actualAvailableQty = selectedPart.available || (selectedPart.stockQuantity - (selectedPart.allocated || 0));
    
    if (quantity > actualAvailableQty) {
      alert(`Quantity cannot exceed available stock. Available: ${actualAvailableQty} units.`);
      return;
    }

    const existingIndex = issueItems.findIndex((item) => item.fromStock === selectedPart.id);
    if (existingIndex >= 0) {
      // Item already exists, add to existing quantity
      const currentQty = issueItems[existingIndex].quantity;
      const newQty = currentQty + quantity;
      
      // Get fresh available stock for validation (in case stock changed)
      // Use flexible matching to find the stock item
      const existingItem = issueItems[existingIndex];
      let stockItem = availableStock.find(s => s.id === selectedPart.id);
      if (!stockItem) {
        stockItem = availableStock.find(s => 
          s.partId === selectedPart.id || 
          s.id === selectedPart.partId ||
          (selectedPart.partNumber && (s.partNumber === selectedPart.partNumber || (s as any).partCode === selectedPart.partNumber)) ||
          (existingItem.partNumber && (s.partNumber === existingItem.partNumber || (s as any).partCode === existingItem.partNumber))
        );
      }
      
      const freshAvailableQty = stockItem 
        ? (stockItem.available || (stockItem.stockQuantity - (stockItem.allocated || 0)))
        : actualAvailableQty;
      
      if (newQty > freshAvailableQty) {
        alert(`Total quantity cannot exceed available stock. Available: ${freshAvailableQty} units. Current in list: ${currentQty} units.`);
        return;
      }
      
      const updated = [...issueItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        availableQty: freshAvailableQty, // Update to latest available stock
      };
      setIssueItems(updated);
    } else {
      setIssueItems([
        ...issueItems,
        {
          partId: selectedPart.partId,
          partName: selectedPart.partName,
          partNumber: selectedPart.partNumber || (selectedPart as any).partCode || undefined,
          hsnCode: selectedPart.hsnCode,
          fromStock: selectedPart.id,
          quantity,
          unitPrice: selectedPart.unitPrice,
          availableQty: actualAvailableQty, // Use actual available stock, not currentQty
        },
      ]);
    }

    setSelectedPart(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setIssueItems(issueItems.filter((_, i) => i !== index));
  };

  /**
   * Find stock item by multiple criteria: ID, partNumber, or partName
   * This makes part matching flexible and reliable even if IDs change
   */
  const findStockItem = (item: IssueItem): CentralStock | null => {
    // 1. Try by ID (fromStock)
    let stockItem = availableStock.find(s => s.id === item.fromStock);
    if (stockItem) return stockItem;

    // 2. Try by partId
    stockItem = availableStock.find(s => s.partId === item.fromStock || s.id === item.partId);
    if (stockItem) return stockItem;

    // 3. Try by partNumber (case-insensitive, exact match)
    if (item.partNumber) {
      stockItem = availableStock.find(s => 
        s.partNumber?.toLowerCase() === item.partNumber.toLowerCase() ||
        (s as any).partCode?.toLowerCase() === item.partNumber.toLowerCase()
      );
      if (stockItem) return stockItem;
    }

    // 4. Try by partName (case-insensitive, exact match first, then partial)
    if (item.partName) {
      stockItem = availableStock.find(s => 
        s.partName?.toLowerCase() === item.partName.toLowerCase()
      );
      if (stockItem) return stockItem;
      
      // Fallback to partial match
      stockItem = availableStock.find(s => 
        s.partName?.toLowerCase().includes(item.partName.toLowerCase()) ||
        item.partName.toLowerCase().includes(s.partName?.toLowerCase() || '')
      );
      if (stockItem) return stockItem;
    }

    return null;
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    
    const item = issueItems[index];
    const currentQty = item.quantity;
    
    // Find stock item using flexible matching (by ID, partNumber, or partName)
    const stockItem = findStockItem(item);
    
    // Calculate actual available stock
    // Use fresh stock if found, otherwise fall back to stored availableQty
    let actualAvailableQty: number;
    if (stockItem) {
      actualAvailableQty = stockItem.available || (stockItem.stockQuantity - (stockItem.allocated || 0));
      
      // Update item with latest part info if found (sync partNumber if missing)
      if (stockItem.partNumber && !item.partNumber) {
        const updated = [...issueItems];
        updated[index] = {
          ...updated[index],
          partNumber: stockItem.partNumber,
        };
        setIssueItems(updated);
      }
    } else {
      // Fallback to stored availableQty if stock item not found in current list
      // This can happen if the part was filtered out or list was refreshed
      actualAvailableQty = item.availableQty || 0;
      
      // Only show warning if trying to increase beyond stored availableQty
      if (newQty > currentQty && newQty > actualAvailableQty) {
        console.warn(`Part "${item.partName}"${item.partNumber ? ` (${item.partNumber})` : ''} not found in current stock list. Using stored available quantity: ${actualAvailableQty}`);
      }
    }
    
    // Only validate if user is INCREASING the quantity
    // If decreasing, allow it without validation (user might be correcting an error)
    if (newQty > currentQty && newQty > actualAvailableQty) {
      alert(`Quantity cannot exceed available stock. Available: ${actualAvailableQty} units.`);
      return;
    }
    
    // If user is trying to set quantity higher than available, cap it at available
    // But only if they're increasing (not decreasing)
    const finalQty = newQty > actualAvailableQty && newQty > currentQty 
      ? actualAvailableQty 
      : newQty;
    
    // Update the item with new quantity and refresh availableQty
    const updated = [...issueItems];
    updated[index] = {
      ...updated[index],
      quantity: finalQty,
      availableQty: actualAvailableQty, // Update to latest available stock (or keep stored value)
    };
    setIssueItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (issueItems.length === 0) {
      alert("Please add at least one item to issue");
      return;
    }

    if (!confirm("Are you sure you want to submit this parts issue request? It will require admin approval before parts can be issued.")) {
      return;
    }

    // Get fresh stock data to ensure we have latest partNumber and partName
    const freshStock = availableStock.length > 0 ? availableStock : await (async () => {
      try {
        const { centralInventoryRepository } = await import('@/core/repositories/central-inventory.repository');
        return await centralInventoryRepository.getAllStock();
      } catch (e) {
        console.warn('Could not fetch fresh stock:', e);
        return availableStock;
      }
    })();

    const formData: PartsIssueFormData = {
      serviceCenterId: serviceCenter.id,
      purchaseOrderId: purchaseOrderId || undefined,
      items: issueItems.map((item) => {
        // Find the stock item to get partNumber and partName for flexible matching
        const stockItem = freshStock.find(s => 
          s.id === item.fromStock || 
          s.partId === item.fromStock ||
          (item.partNumber && (s.partNumber === item.partNumber || (s as any).partCode === item.partNumber)) ||
          (item.partName && s.partName === item.partName)
        );
        
        return {
          partId: item.partId,
          quantity: item.quantity,
          fromStock: item.fromStock,
          // Include partNumber and partName for backend flexible matching
          partNumber: item.partNumber || stockItem?.partNumber || undefined,
          partName: item.partName || stockItem?.partName || undefined,
        };
      }),
      notes: notes || undefined,
      transportDetails:
        transportDetails.transporter || transportDetails.trackingNumber
          ? transportDetails
          : undefined,
    };

    await onSubmit(formData);
  };

  const filteredStock = availableStock.filter(
    (s) =>
      s.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = issueItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Center Info */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Service Center</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="font-medium">{serviceCenter.name}</p>
              {serviceCenter.location && (
                <p className="text-sm text-gray-500">{serviceCenter.location}</p>
              )}
              {serviceCenter.contactPerson && (
                <p className="text-sm text-gray-500 mt-1">Contact: {serviceCenter.contactPerson}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Purchase Order Selection */}
      {availablePurchaseOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Link Purchase Order (Optional)</h2>
          </CardHeader>
          <CardBody>
            <select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {availablePurchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} - ₹{po.totalAmount.toLocaleString()} ({po.items.length} items)
                </option>
              ))}
            </select>
          </CardBody>
        </Card>
      )}

      {/* Add Parts */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Add Parts</h2>
        </CardHeader>
        <CardBody>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by part name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {filteredStock.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No stock items found</p>
            ) : (
              filteredStock.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPart(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPart?.id === item.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.partName}</p>
                      <p className="text-sm text-gray-500">{item.hsnCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.currentQty}</p>
                      <p className="text-xs text-gray-400">available</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {selectedPart && (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={selectedPart.currentQty}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quantity"
              />
              <Button type="button" variant="primary" onClick={handleAddItem}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Add
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Issue Items List */}
      {issueItems.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Items to Issue</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {issueItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg"
                >
                  <Package className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{item.partName}</p>
                    <div className="text-sm text-gray-500">
                      {item.partNumber && <span>Part #: {item.partNumber} | </span>}
                      HSN: {item.hsnCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.availableQty}
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">₹{item.unitPrice.toLocaleString()} each</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Transport Details (Optional)</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transporter</label>
            <input
              type="text"
              value={transportDetails.transporter}
              onChange={(e) =>
                setTransportDetails({ ...transportDetails, transporter: e.target.value })
              }
              placeholder="e.g., Fast Logistics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
            <input
              type="text"
              value={transportDetails.trackingNumber}
              onChange={(e) =>
                setTransportDetails({ ...transportDetails, trackingNumber: e.target.value })
              }
              placeholder="e.g., FL-2024-001234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery
            </label>
            <input
              type="datetime-local"
              value={transportDetails.expectedDelivery}
              onChange={(e) =>
                setTransportDetails({ ...transportDetails, expectedDelivery: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardBody>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Notes (Optional)</h2>
        </CardHeader>
        <CardBody>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </CardBody>
      </Card>

      {/* Summary and Submit */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items</span>
              <span className="font-medium">{issueItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Quantity</span>
              <span className="font-medium">
                {issueItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold">Total Amount</span>
                <span className="font-bold text-lg text-blue-600">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || issueItems.length === 0}
                className="flex items-center justify-center gap-2 flex-1"
              >
                <CheckCircle className="w-5 h-5" />
                {isLoading ? "Submitting Request..." : "Submit Request for Approval"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

