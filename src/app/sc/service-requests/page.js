"use client";
import { useState } from "react";
import {
  Search,
  PlusCircle,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Calendar,
  User,
  Car,
  DollarSign,
} from "lucide-react";

export default function ServiceRequests() {
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock data
  const [requests, setRequests] = useState([
    {
      id: "SR-2025-001",
      customerName: "Rajesh Kumar",
      phone: "9876543210",
      vehicle: "Honda City 2020",
      registration: "PB10AB1234",
      serviceType: "Routine Maintenance",
      description: "Regular service - oil change, filter replacement",
      location: "Station",
      preferredDate: "2025-01-20",
      preferredTime: "10:00 AM",
      estimatedCost: "₹3,500",
      status: "Pending Approval",
      urgency: "Normal",
      createdAt: "2025-01-15 09:30",
      createdBy: "SC Staff",
    },
    {
      id: "SR-2025-002",
      customerName: "Priya Sharma",
      phone: "9876543211",
      vehicle: "Maruti Swift 2019",
      registration: "MH01XY5678",
      serviceType: "Repair",
      description: "Brake pads replacement",
      estimatedCost: "₹4,200",
      location: "Home Service",
      preferredDate: "2025-01-18",
      preferredTime: "2:00 PM",
      status: "Pending Approval",
      urgency: "High",
      createdAt: "2025-01-15 11:15",
      createdBy: "Call Center",
    },
    {
      id: "SR-2025-003",
      customerName: "Amit Patel",
      phone: "9876543212",
      vehicle: "Hyundai i20 2021",
      registration: "DL05CD9012",
      serviceType: "Inspection",
      description: "Pre-purchase inspection",
      estimatedCost: "₹1,500",
      location: "Station",
      preferredDate: "2025-01-19",
      preferredTime: "3:00 PM",
      status: "Approved",
      urgency: "Normal",
      createdAt: "2025-01-14 14:20",
      createdBy: "Service Advisor",
    },
  ]);

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    if (filter === "pending") return req.status === "Pending Approval";
    if (filter === "approved") return req.status === "Approved";
    if (filter === "rejected") return req.status === "Rejected";
    return true;
  });

  const handleApprove = (id) => {
    setRequests(
      requests.map((req) =>
        req.id === id ? { ...req, status: "Approved" } : req
      )
    );
    alert("Service request approved! Job card will be created automatically.");
  };

  const handleReject = (id) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      setRequests(
        requests.map((req) =>
          req.id === id ? { ...req, status: "Rejected", rejectionReason: reason } : req
        )
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Service Requests</h1>
            <p className="text-gray-500">Manage customer service requests and approvals</p>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2">
            <PlusCircle size={20} />
            Create Service Request
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name, phone, or request ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {request.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full ${getUrgencyColor(
                        request.urgency
                      )}`}
                      title={request.urgency}
                    ></span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User size={18} className="text-gray-400" />
                      <span className="font-medium">{request.customerName}</span>
                      <span className="text-gray-500">• {request.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Car size={18} className="text-gray-400" />
                      <span>{request.vehicle}</span>
                      <span className="text-gray-500">• {request.registration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FileText size={18} className="text-gray-400" />
                      <span className="font-medium">{request.serviceType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-gray-400" />
                      <span>
                        {request.preferredDate} at {request.preferredTime}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{request.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Location: <span className="font-medium text-gray-700">{request.location}</span>
                    </span>
                    <span className="text-gray-500">
                      Estimated: <span className="font-medium text-gray-700">{request.estimatedCost}</span>
                    </span>
                    <span className="text-gray-500">
                      Created: <span className="font-medium text-gray-700">{request.createdAt}</span>
                    </span>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetails(true);
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition inline-flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    {request.status === "Pending Approval" && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Service Requests Found</h3>
            <p className="text-gray-500">No requests match the current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Service Request Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Request ID</p>
                  <p className="font-semibold">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{selectedRequest.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-semibold">{selectedRequest.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{selectedRequest.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold">{selectedRequest.vehicle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration</p>
                  <p className="font-semibold">{selectedRequest.registration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <p className="font-semibold">{selectedRequest.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedRequest.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Preferred Date</p>
                  <p className="font-semibold">{selectedRequest.preferredDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Preferred Time</p>
                  <p className="font-semibold">{selectedRequest.preferredTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="font-semibold text-green-600">{selectedRequest.estimatedCost}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgency</p>
                  <p className="font-semibold">{selectedRequest.urgency}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
              {selectedRequest.status === "Pending Approval" && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetails(false);
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

