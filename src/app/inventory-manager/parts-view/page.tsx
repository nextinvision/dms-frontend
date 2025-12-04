"use client";
import { useState, useEffect } from "react";
import { partsMasterService } from "@/services/inventory/partsMaster.service";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SearchBar } from "@/components/ui/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Package, Search, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";
import { initializeInventoryMockData } from "@/__mocks__/data/inventory.mock";
import type { Part } from "@/shared/types/inventory.types";

export default function PartsViewPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeInventoryMockData();
    fetchParts();
  }, []);

  useEffect(() => {
    let filtered = parts;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    
    setFilteredParts(filtered);
  }, [parts, searchQuery, categoryFilter]);

  const fetchParts = async () => {
    try {
      setIsLoading(true);
      const data = await partsMasterService.getAll();
      setParts(data);
      setFilteredParts(data);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Array.from(new Set(parts.map((p) => p.category)));

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Parts View</h1>
          <p className="text-gray-500 mt-1">Browse and search your inventory</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={(query) => setSearchQuery(query)}
              placeholder="Search by part name, number, or ID..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading parts...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Parts</p>
                      <p className="text-2xl font-bold text-gray-900">{parts.length}</p>
                    </div>
                    <Package className="text-indigo-600" size={32} />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Stock</p>
                      <p className="text-2xl font-bold text-green-600">
                        {parts.filter((p) => p.stockQuantity >= p.minStockLevel).length}
                      </p>
                    </div>
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Low Stock</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {parts.filter((p) => p.stockQuantity < p.minStockLevel && p.stockQuantity > 0).length}
                      </p>
                    </div>
                    <AlertTriangle className="text-orange-600" size={32} />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-600">
                        {parts.filter((p) => p.stockQuantity === 0).length}
                      </p>
                    </div>
                    <TrendingDown className="text-red-600" size={32} />
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParts.map((part) => {
                const isLowStock = part.stockQuantity < part.minStockLevel && part.stockQuantity > 0;
                const isOutOfStock = part.stockQuantity === 0;
                
                return (
                  <Card key={part.id} className="hover:shadow-lg transition-all">
                    <CardBody>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Package className={`mt-1 flex-shrink-0 ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-indigo-600"}`} size={20} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{part.partName}</h3>
                            <p className="text-xs text-gray-500 mt-1">{part.partId}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isOutOfStock && <Badge variant="danger">Out</Badge>}
                          {isLowStock && !isOutOfStock && <Badge variant="warning">Low</Badge>}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Part Number:</span>
                          <span className="font-medium text-gray-900">{part.partNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Category:</span>
                          <Badge variant="info">{part.category}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold text-indigo-600">₹{part.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Stock:</span>
                          <span className={`font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"}`}>
                            {part.stockQuantity} {part.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Min Level:</span>
                          <span className="text-gray-700">{part.minStockLevel} {part.unit}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {filteredParts.length === 0 && !isLoading && (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Parts Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

