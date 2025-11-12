"use client";
import { useState } from "react";
import {
  Search,
  Car,
  User,
  Calendar,
  Wrench,
  DollarSign,
  FileText,
  PlusCircle,
  History,
  Phone,
  Hash,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function VehicleSearch() {
  const [searchType, setSearchType] = useState("phone"); // phone, registration, vin
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Mock data - replace with API calls
  const mockVehicles = [
    {
      id: 1,
      phone: "9876543210",
      registration: "PB10AB1234",
      vin: "MH12AB3456CD7890",
      customerName: "Rajesh Kumar",
      customerEmail: "rajesh@example.com",
      customerAddress: "123 Main St, Pune",
      vehicleMake: "Honda",
      vehicleModel: "City",
      vehicleYear: 2020,
      vehicleColor: "White",
      lastServiceDate: "2024-12-15",
      totalServices: 8,
      totalSpent: "₹45,000",
    },
    {
      id: 2,
      phone: "9876543211",
      registration: "MH01XY5678",
      vin: "MH12AB3456CD7891",
      customerName: "Priya Sharma",
      customerEmail: "priya@example.com",
      customerAddress: "456 Park Ave, Mumbai",
      vehicleMake: "Maruti",
      vehicleModel: "Swift",
      vehicleYear: 2019,
      vehicleColor: "Red",
      lastServiceDate: "2024-11-20",
      totalServices: 5,
      totalSpent: "₹28,000",
    },
  ];

  const mockServiceHistory = [
    {
      id: 1,
      date: "2024-12-15",
      type: "Routine Maintenance",
      engineer: "Engineer 1",
      parts: ["Engine Oil", "Air Filter"],
      labor: "₹1,500",
      partsCost: "₹2,500",
      total: "₹4,000",
      invoice: "INV-2024-456",
      status: "Completed",
      odometer: "25,000 km",
    },
    {
      id: 2,
      date: "2024-11-20",
      type: "Repair",
      engineer: "Engineer 2",
      parts: ["Brake Pads", "Brake Fluid"],
      labor: "₹2,000",
      partsCost: "₹3,500",
      total: "₹5,500",
      invoice: "INV-2024-389",
      status: "Completed",
      odometer: "24,500 km",
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }

    // Mock search logic
    let found = null;
    if (searchType === "phone") {
      found = mockVehicles.find((v) => v.phone.includes(searchQuery));
    } else if (searchType === "registration") {
      found = mockVehicles.find((v) =>
        v.registration.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (searchType === "vin") {
      found = mockVehicles.find((v) =>
        v.vin.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (found) {
      setSearchResults(found);
      setServiceHistory(mockServiceHistory);
    } else {
      setSearchResults(null);
      setShowAddVehicle(true);
    }
  };

  const handleAddNewVehicle = () => {
    // Navigate to add vehicle form
    alert("Redirecting to Add New Vehicle form...");
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Vehicle Search</h1>
          <p className="text-gray-500">Search vehicles by phone, registration, or VIN number</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Type Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
              <button
                onClick={() => setSearchType("phone")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  searchType === "phone"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Phone size={16} className="inline mr-2" />
                Phone Number
              </button>
              <button
                onClick={() => setSearchType("registration")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  searchType === "registration"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Hash size={16} className="inline mr-2" />
                Registration
              </button>
              <button
                onClick={() => setSearchType("vin")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  searchType === "vin"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CreditCard size={16} className="inline mr-2" />
                VIN Number
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={
                  searchType === "phone"
                    ? "Enter 10-digit phone number"
                    : searchType === "registration"
                    ? "Enter registration number (e.g., PB10AB1234)"
                    : "Enter VIN number (17 characters)"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults ? (
          <div className="space-y-6">
            {/* Vehicle Details Card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Car className="text-blue-600" size={28} />
                  Vehicle Details
                </h2>
                <div className="flex gap-3">
                  <Link
                    href={`/sc/job-cards?action=create&vehicleId=${searchResults.id}`}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                  >
                    <PlusCircle size={16} className="inline mr-2" />
                    Create Job Card
                  </Link>
                  <Link
                    href={`/sc/invoices?vehicleId=${searchResults.id}`}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                  >
                    <FileText size={16} className="inline mr-2" />
                    View Invoices
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">Name:</span>{" "}
                      <span className="text-gray-800">{searchResults.customerName}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Phone:</span>{" "}
                      <span className="text-gray-800">{searchResults.phone}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{" "}
                      <span className="text-gray-800">{searchResults.customerEmail}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Address:</span>{" "}
                      <span className="text-gray-800">{searchResults.customerAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Car size={20} />
                    Vehicle Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">Make/Model:</span>{" "}
                      <span className="text-gray-800">
                        {searchResults.vehicleMake} {searchResults.vehicleModel}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Year:</span>{" "}
                      <span className="text-gray-800">{searchResults.vehicleYear}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Color:</span>{" "}
                      <span className="text-gray-800">{searchResults.vehicleColor}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Registration:</span>{" "}
                      <span className="text-gray-800">{searchResults.registration}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">VIN:</span>{" "}
                      <span className="text-gray-800 font-mono text-xs">{searchResults.vin}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Last Service Date</p>
                  <p className="text-lg font-bold text-gray-800">{searchResults.lastServiceDate}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Total Services</p>
                  <p className="text-lg font-bold text-gray-800">{searchResults.totalServices}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-lg font-bold text-gray-800">{searchResults.totalSpent}</p>
                </div>
              </div>
            </div>

            {/* Service History */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <History className="text-purple-600" size={28} />
                Service History
              </h2>

              {serviceHistory.length > 0 ? (
                <div className="space-y-4">
                  {serviceHistory.map((service) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {service.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Calendar size={14} className="inline mr-1" />
                              {service.date}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Wrench size={14} className="inline mr-1" />
                              {service.engineer}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Odometer: {service.odometer}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {service.parts.map((part, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 text-right">
                          <p className="text-sm text-gray-600">Labor: {service.labor}</p>
                          <p className="text-sm text-gray-600">Parts: {service.partsCost}</p>
                          <p className="text-lg font-bold text-gray-800 mt-1">
                            Total: {service.total}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Invoice: {service.invoice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No service history found</p>
              )}
            </div>
          </div>
        ) : showAddVehicle && searchQuery ? (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-center py-8">
              <Car className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Vehicle Not Found</h3>
              <p className="text-gray-500 mb-6">
                No vehicle found with the provided {searchType === "phone" ? "phone number" : searchType === "registration" ? "registration number" : "VIN"}
              </p>
              <button
                onClick={handleAddNewVehicle}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Add New Vehicle
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

