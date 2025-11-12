"use client";
import { useState } from "react";
import {
  Truck,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Phone,
  Navigation,
  Wrench,
  FileText,
  PlusCircle,
} from "lucide-react";

export default function HomeService() {
  const [filter, setFilter] = useState("all"); // all, scheduled, in_progress, completed
  const [selectedService, setSelectedService] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock home service data
  const [homeServices, setHomeServices] = useState([
    {
      id: "HS-2025-001",
      customerName: "Rajesh Kumar",
      phone: "9876543210",
      vehicle: "Honda City 2020",
      registration: "PB10AB1234",
      address: "123 Main Street, Sector 5, Pune",
      serviceType: "Routine Maintenance",
      scheduledDate: "2025-01-20",
      scheduledTime: "10:00 AM",
      engineer: "Engineer 1",
      status: "Scheduled",
      estimatedCost: "₹3,500",
      createdAt: "2025-01-15 09:30",
    },
    {
      id: "HS-2025-002",
      customerName: "Priya Sharma",
      phone: "9876543211",
      vehicle: "Maruti Swift 2019",
      registration: "MH01XY5678",
      address: "456 Park Avenue, Bandra West, Mumbai",
      serviceType: "AC Repair",
      scheduledDate: "2025-01-18",
      scheduledTime: "2:00 PM",
      engineer: "Engineer 2",
      status: "In Progress",
      estimatedCost: "₹4,200",
      startTime: "2025-01-18 14:15",
      createdAt: "2025-01-15 11:15",
    },
    {
      id: "HS-2025-003",
      customerName: "Amit Patel",
      phone: "9876543212",
      vehicle: "Hyundai i20 2021",
      registration: "DL05CD9012",
      address: "789 MG Road, Connaught Place, Delhi",
      serviceType: "Oil Change",
      scheduledDate: "2025-01-19",
      scheduledTime: "11:00 AM",
      engineer: "Engineer 3",
      status: "Completed",
      estimatedCost: "₹1,500",
      completedAt: "2025-01-19 11:45",
      createdAt: "2025-01-15 14:20",
    },
  ]);

  const filteredServices = homeServices.filter((service) => {
    if (filter === "all") return true;
    return service.status.toLowerCase().replace(" ", "_") === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "bg-blue-100 text-blue-700 border-blue-300",
      "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-300",
      Completed: "bg-green-100 text-green-700 border-green-300",
      Cancelled: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || colors.Scheduled;
  };

  const stats = {
    scheduled: homeServices.filter((s) => s.status === "Scheduled").length,
    inProgress: homeServices.filter((s) => s.status === "In Progress").length,
    completed: homeServices.filter((s) => s.status === "Completed").length,
    total: homeServices.length,
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Home Service</h1>
            <p className="text-gray-500">Manage mobile service appointments and track engineers</p>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2">
            <PlusCircle size={20} />
            Schedule Home Service
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Calendar size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{stats.scheduled}</h2>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
                <Wrench size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{stats.inProgress}</h2>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{stats.completed}</h2>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Truck size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{stats.total}</h2>
            <p className="text-sm text-gray-600">Total Services</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex gap-2">
            {["all", "scheduled", "in_progress", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "in_progress"
                  ? "In Progress"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {service.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        service.status
                      )}`}
                    >
                      {service.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User size={18} className="text-gray-400" />
                      <span className="font-medium">{service.customerName}</span>
                      <span className="text-gray-500">• {service.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Truck size={18} className="text-gray-400" />
                      <span>{service.vehicle}</span>
                      <span className="text-gray-500">• {service.registration}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin size={18} className="text-gray-400 mt-1" />
                      <span className="text-sm">{service.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-gray-400" />
                      <span>
                        {service.scheduledDate} at {service.scheduledTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Service: <span className="font-medium text-gray-700">{service.serviceType}</span>
                    </span>
                    <span className="text-gray-500">
                      Engineer: <span className="font-medium text-gray-700">{service.engineer}</span>
                    </span>
                    <span className="text-gray-500">
                      Estimated: <span className="font-medium text-gray-700">{service.estimatedCost}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setShowDetails(true);
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition inline-flex items-center gap-2"
                    >
                      <FileText size={16} />
                      View Details
                    </button>
                    {service.status === "Scheduled" && (
                      <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                        Dispatch Engineer
                      </button>
                    )}
                    {service.status === "In Progress" && (
                      <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                        Track Location
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Truck className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Home Services Found</h3>
            <p className="text-gray-500">No services match the current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Service Details Modal */}
      {showDetails && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Home Service Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                  {selectedService.id}
                </span>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                    selectedService.status
                  )}`}
                >
                  {selectedService.status}
                </span>
              </div>

              {/* Customer & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-2">Customer Information</h3>
                  <p className="text-sm text-gray-700">{selectedService.customerName}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedService.phone}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-2">Vehicle Information</h3>
                  <p className="text-sm text-gray-700">{selectedService.vehicle}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedService.registration}</p>
                </div>
              </div>

              {/* Service Location */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MapPin className="text-red-600" size={20} />
                  Service Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedService.address}</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <Navigation size={14} />
                    Open in Maps
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Schedule</h3>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-800">{selectedService.scheduledDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-800">{selectedService.scheduledTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Engineer</p>
                    <p className="font-medium text-gray-800">{selectedService.engineer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="font-medium text-gray-800">{selectedService.estimatedCost}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Close
                </button>
                {selectedService.status === "Scheduled" && (
                  <button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
                    Dispatch Engineer
                  </button>
                )}
                {selectedService.status === "In Progress" && (
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
                    Track Engineer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

