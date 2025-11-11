"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Package, CheckCircle, AlertTriangle, DollarSign, X } from "lucide-react";

// Sample inventory data structure - in real app, this would come from API
const defaultInventoryData = [
  {
    id: 1,
    partName: "Engine Oil 5L",
    sku: "EO-5L-001",
    category: "Fluids",
    quantity: 45,
    price: "₹450",
    status: "In Stock",
    centerId: 1,
    centerName: "Delhi Central Hub",
  },
  {
    id: 2,
    partName: "Air Filter",
    sku: "AF-001",
    category: "Filters",
    quantity: 12,
    price: "₹250",
    status: "In Stock",
    centerId: 1,
    centerName: "Delhi Central Hub",
  },
  {
    id: 3,
    partName: "Spark Plugs (Set of 4)",
    sku: "SP-4-001",
    category: "Ignition",
    quantity: 15,
    price: "₹600",
    status: "In Stock",
    centerId: 2,
    centerName: "Mumbai Metroplex",
  },
  {
    id: 4,
    partName: "Brake Pads",
    sku: "BP-001",
    category: "Brakes",
    quantity: 8,
    price: "₹1200",
    status: "In Stock",
    centerId: 2,
    centerName: "Mumbai Metroplex",
  },
  {
    id: 5,
    partName: "Coolant 5L",
    sku: "CL-5L-001",
    category: "Fluids",
    quantity: 6,
    price: "₹350",
    status: "Low Stock",
    centerId: 3,
    centerName: "Bangalore Innovation Center",
  },
  {
    id: 6,
    partName: "Oil Filter",
    sku: "OF-001",
    category: "Filters",
    quantity: 4,
    price: "₹180",
    status: "Low Stock",
    centerId: 3,
    centerName: "Bangalore Innovation Center",
  },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState(defaultInventoryData);
  const [filteredInventory, setFilteredInventory] = useState(defaultInventoryData);
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [centers, setCenters] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    partName: "",
    sku: "",
    category: "",
    quantity: "",
    price: "",
    status: "In Stock",
    centerId: "",
  });

  // Load centers and inventory from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load service centers
      const storedCenters = JSON.parse(localStorage.getItem('serviceCenters') || '{}');
      const staticCenters = [
        { id: 1, name: "Delhi Central Hub" },
        { id: 2, name: "Mumbai Metroplex" },
        { id: 3, name: "Bangalore Innovation Center" },
      ];
      
      // Merge static and stored centers
      const allCenters = [...staticCenters];
      Object.values(storedCenters).forEach(center => {
        if (!allCenters.find(c => c.id === center.id)) {
          allCenters.push({ id: center.id, name: center.name });
        }
      });
      setCenters(allCenters);

      // Load inventory from localStorage if available
      const storedInventory = JSON.parse(localStorage.getItem('inventoryData') || '[]');
      if (storedInventory.length > 0) {
        setInventory(storedInventory);
        setFilteredInventory(storedInventory);
      }
    }
  }, []);

  // Filter inventory based on selected center
  useEffect(() => {
    if (selectedCenter === "all") {
      setFilteredInventory(inventory);
    } else {
      setFilteredInventory(inventory.filter(item => item.centerId === parseInt(selectedCenter)));
    }
  }, [selectedCenter, inventory]);

  // Calculate summary statistics
  const totalParts = filteredInventory.length;
  const inStock = filteredInventory.filter(item => item.status === "In Stock").length;
  const lowStock = filteredInventory.filter(item => item.status === "Low Stock").length;
  const totalValue = filteredInventory.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('₹', '').replace(',', '')) || 0;
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.partName.trim() || !form.sku.trim() || !form.centerId) {
      alert("Please fill all required fields!");
      return;
    }

    if (editingItem) {
      // Update existing item
      const updated = inventory.map(item =>
        item.id === editingItem.id
          ? { ...item, ...form, quantity: parseInt(form.quantity) || 0 }
          : item
      );
      setInventory(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('inventoryData', JSON.stringify(updated));
      }
      alert("Part updated successfully!");
    } else {
      // Add new item
      const selectedCenterName = centers.find(c => c.id === parseInt(form.centerId))?.name || "";
      const newItem = {
        id: inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1,
        ...form,
        quantity: parseInt(form.quantity) || 0,
        centerName: selectedCenterName,
        centerId: parseInt(form.centerId),
      };
      const updated = [...inventory, newItem];
      setInventory(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('inventoryData', JSON.stringify(updated));
      }
      alert("Part added successfully!");
    }

    setForm({
      partName: "",
      sku: "",
      category: "",
      quantity: "",
      price: "",
      status: "In Stock",
      centerId: "",
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      partName: item.partName,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity.toString(),
      price: item.price,
      status: item.status,
      centerId: item.centerId.toString(),
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this part?")) {
      const updated = inventory.filter(item => item.id !== id);
      setInventory(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('inventoryData', JSON.stringify(updated));
      }
      alert("Part deleted successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Inventory Management
        </h1>
        <p className="text-gray-600">Manage parts and inventory across service centers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalParts}</p>
          <p className="text-gray-600 mt-1">Total Parts</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{inStock}</p>
          <p className="text-gray-600 mt-1">In Stock</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{lowStock}</p>
          <p className="text-gray-600 mt-1">Low Stock</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ₹{(totalValue / 1000).toFixed(0)}K
          </p>
          <p className="text-gray-600 mt-1">Total Value</p>
        </div>
      </div>

      {/* Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Service Center:</label>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
          >
            <option value="all">All Centers</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setForm({
              partName: "",
              sku: "",
              category: "",
              quantity: "",
              price: "",
              status: "In Stock",
              centerId: "",
            });
            setShowAddForm(true);
          }}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Part
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-purple-600">Inventory List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Part Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                {selectedCenter === "all" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Service Center
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={selectedCenter === "all" ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.partName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {selectedCenter === "all" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.centerName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setForm({
                  partName: "",
                  sku: "",
                  category: "",
                  quantity: "",
                  price: "",
                  status: "In Stock",
                  centerId: "",
                });
              }}
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 pr-8">
              {editingItem ? "Edit Part" : "Add New Part"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Center *
                </label>
                <select
                  value={form.centerId}
                  onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  required
                >
                  <option value="">Select Service Center</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Name *
                </label>
                <input
                  type="text"
                  value={form.partName}
                  onChange={(e) => setForm({ ...form, partName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="₹450"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition"
              >
                {editingItem ? "Update Part" : "Add Part"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

