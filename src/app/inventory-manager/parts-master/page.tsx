"use client";
import { useState, useEffect, useMemo } from "react";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import type { Part } from "@/features/inventory/types/inventory.types";
import { useRole } from "@/shared/hooks";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";

export default function PartsMasterPage() {
  const { userInfo } = useRole();
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Get service center ID from user info (serviceCenter is the ID string)
  const serviceCenterId = userInfo?.serviceCenter || "";

  useEffect(() => {
    fetchParts();
  }, []);

  // Filter parts based on search and category
  useEffect(() => {
    let filtered = parts;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
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

      // Get service center context and extract ID
      const scContext = getServiceCenterContext();
      const serviceCenterId = scContext.serviceCenterId;

      // Convert serviceCenterId to string (from string | number | null)
      const serviceCenterIdStr = typeof serviceCenterId === 'number'
        ? String(serviceCenterId)
        : serviceCenterId || undefined;

      // Fetch parts filtered by service center
      const data = await partsMasterService.getAll({ serviceCenterId: serviceCenterIdStr });
      setParts(data);
      setFilteredParts(data);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => Array.from(new Set(parts.map((p) => p.category))), [parts]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalParts = parts.length;
    const inStock = parts.filter((p) => p.stockQuantity >= p.minStockLevel).length;
    const lowStock = parts.filter((p) => p.stockQuantity < p.minStockLevel && p.stockQuantity > 0).length;
    const outOfStock = parts.filter((p) => p.stockQuantity === 0).length;
    return { totalParts, inStock, lowStock, outOfStock };
  }, [parts]);

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600">Parts Master</h1>
            <p className="text-gray-500 mt-1">View your parts catalog and stock levels</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={(query) => setSearchQuery(query)}
              placeholder="Search by part name, number, ID, or description..."
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Parts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalParts}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
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
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
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
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <TrendingDown className="text-red-600" size={32} />
              </div>
            </CardBody>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading parts...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {parts.length === 0 ? "No Parts Found" : "No Parts Match Your Search"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {parts.length === 0
                    ? "Parts will appear here once added by the Central Inventory Manager."
                    : "Try adjusting your search or filter criteria."}
                </p>

              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Min Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        High Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParts.map((part) => {
                      const isLowStock = part.stockQuantity < part.minStockLevel && part.stockQuantity > 0;
                      const isOutOfStock = part.stockQuantity === 0;

                      return (
                        <tr
                          key={part.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{part.partId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{part.partName}</div>
                            {part.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{part.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{part.partNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{(part as any).brandName || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={(part as any).partType === "NEW" ? "info" : "default"}>
                              {(part as any).partType || "NEW"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="info">{part.category}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{(part.price ?? 0).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-gray-900"}`}>
                              {part.stockQuantity} {part.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{part.minStockLevel} {part.unit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(part as any).highValuePart ? (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isOutOfStock ? (
                              <Badge variant="danger" className="flex items-center gap-1 w-fit">
                                <AlertTriangle size={14} />
                                Out of Stock
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <AlertTriangle size={14} />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <CheckCircle size={14} />
                                In Stock
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className="text-gray-400 text-xs">View Only</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}




      </div>
    </div>
  );
}
