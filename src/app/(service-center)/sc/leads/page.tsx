"use client";
import { useState, useMemo } from "react";
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  User,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationRepository } from "@/core/repositories/quotation.repository";
import { customerRepository } from "@/core/repositories/customer.repository";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import type { Quotation, QuotationStatus } from "@/shared/types/quotation.types";

// Map quotation status to lead-like status for display
type LeadStatus = "SENT_TO_CUSTOMER" | "CUSTOMER_APPROVED" | "CUSTOMER_REJECTED" | "NO_RESPONSE_LEAD";
type LeadFilterType = "all" | LeadStatus;

// Transform quotation to lead-like interface for display
interface LeadDisplay {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleDetails?: string;
  serviceType?: string;
  status: LeadStatus;
  quotationNumber: string;
  quotationDate: string;
  totalAmount: number;
  sentToCustomerAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  customerId?: string;
  vehicleId?: string;
  quotationId: string;
}

export default function Leads() {
  const queryClient = useQueryClient();
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
  const activeServiceCenterId = serviceCenterContext.serviceCenterId || "sc-001";

  const [filter, setFilter] = useState<LeadFilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<LeadDisplay | null>(null);

  // Fetch quotations with SENT_TO_CUSTOMER status (these are our leads)
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations", activeServiceCenterId],
    queryFn: () => quotationRepository.getAll({ serviceCenterId: activeServiceCenterId }),
  });

  // Transform quotations to lead display format
  const leads: LeadDisplay[] = useMemo(() => {
    return quotations
      .filter((q) =>
        q.status === "SENT_TO_CUSTOMER" ||
        q.status === "CUSTOMER_APPROVED" ||
        q.status === "CUSTOMER_REJECTED" ||
        q.status === "NO_RESPONSE_LEAD"
      )
      .map((quotation) => ({
        id: quotation.id,
        quotationId: quotation.id,
        customerName: quotation.customer?.name ||
          `${quotation.customer?.firstName || ''} ${quotation.customer?.lastName || ''}`.trim() ||
          'Unknown Customer',
        phone: quotation.customer?.phone || '',
        email: quotation.customer?.email,
        vehicleMake: quotation.vehicle?.vehicleMake || quotation.vehicle?.make,
        vehicleModel: quotation.vehicle?.vehicleModel || quotation.vehicle?.model,
        vehicleDetails: quotation.vehicle?.registration,
        serviceType: quotation.documentType,
        status: quotation.status as LeadStatus,
        quotationNumber: quotation.quotationNumber,
        quotationDate: quotation.quotationDate,
        totalAmount: quotation.totalAmount,
        sentToCustomerAt: quotation.sentToCustomerAt,
        createdAt: quotation.createdAt,
        updatedAt: quotation.updatedAt,
        notes: quotation.notes || quotation.customNotes,
        customerId: quotation.customerId,
        vehicleId: quotation.vehicleId,
      }));
  }, [quotations]);

  // Fetch customer details when viewing a lead
  const { data: leadCustomer } = useQuery({
    queryKey: ["customer", selectedLead?.customerId],
    queryFn: () => customerRepository.getById(selectedLead!.customerId!),
    enabled: !!selectedLead?.customerId && showViewModal,
  });


  // Filter leads based on status and search query
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filter !== "all" && lead.status !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          lead.customerName.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.vehicleMake?.toLowerCase().includes(query) ||
          lead.vehicleModel?.toLowerCase().includes(query) ||
          lead.quotationNumber.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [leads, filter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT_TO_CUSTOMER":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "CUSTOMER_APPROVED":
        return "bg-green-100 text-green-700 border-green-300";
      case "CUSTOMER_REJECTED":
        return "bg-red-100 text-red-700 border-red-300";
      case "NO_RESPONSE_LEAD":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SENT_TO_CUSTOMER":
        return "Sent to Customer";
      case "CUSTOMER_APPROVED":
        return "Customer Approved";
      case "CUSTOMER_REJECTED":
        return "Customer Rejected";
      case "NO_RESPONSE_LEAD":
        return "No Response";
      default:
        return status;
    }
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Customer Leads</h1>
            <p className="text-gray-500">Track quotations sent to customers and their responses</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer, phone, quotation number, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "SENT_TO_CUSTOMER", "CUSTOMER_APPROVED", "CUSTOMER_REJECTED", "NO_RESPONSE_LEAD"] as LeadFilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {f === "all" ? "All" : getStatusLabel(f)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-600">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">{lead.quotationNumber}</div>
                        <div className="text-xs text-gray-500">{new Date(lead.quotationDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.phone}</div>
                        {lead.email && (
                          <div className="text-xs text-gray-500">{lead.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.vehicleMake && lead.vehicleModel ? (
                          <div className="text-sm text-gray-900">
                            {lead.vehicleMake} {lead.vehicleModel}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                        {lead.vehicleDetails && (
                          <div className="text-xs text-gray-500">{lead.vehicleDetails}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{lead.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.sentToCustomerAt ? new Date(lead.sentToCustomerAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye size={18} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Lead Modal */}
      {showViewModal && selectedLead && (() => {
        // Use fetched customer details
        const customer = leadCustomer;

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-[101]">
                <h2 className="text-2xl font-bold text-gray-900">Lead & Customer Details</h2>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedLead(null); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Customer Information Section */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Customer Name</label>
                      <div className="text-base font-semibold text-gray-900">{selectedLead.customerName}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Phone Number</label>
                      <div className="text-base text-gray-900 flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        {selectedLead.phone}
                      </div>
                    </div>
                    {selectedLead.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Email Address</label>
                        <div className="text-base text-gray-900 flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          {selectedLead.email}
                        </div>
                      </div>
                    )}
                    {customer && (
                      <>
                        {customer.address && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 block mb-1">Address</label>
                            <div className="text-base text-gray-900">{customer.address}</div>
                            {customer.cityState && (
                              <div className="text-sm text-gray-600 mt-1">{customer.cityState}</div>
                            )}
                            {customer.pincode && (
                              <div className="text-sm text-gray-600">{customer.pincode}</div>
                            )}
                          </div>
                        )}
                        {customer.customerNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">Customer Number</label>
                            <div className="text-base text-gray-900">{customer.customerNumber}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Vehicle Information Section */}
                {(selectedLead.vehicleMake || selectedLead.vehicleModel || customer?.vehicles) && (
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Car size={20} />
                      Vehicle Information
                    </h3>
                    {customer?.vehicles && customer.vehicles.length > 0 ? (
                      <div className="space-y-3">
                        {customer.vehicles.map((vehicle: any, index: number) => (
                          <div key={vehicle.id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {vehicle.registration && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">Registration Number</label>
                                  <div className="text-base font-semibold text-gray-900">{vehicle.registration}</div>
                                </div>
                              )}
                              {(vehicle.make || vehicle.model) && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">Make & Model</label>
                                  <div className="text-base text-gray-900">
                                    {vehicle.make} {vehicle.model}
                                  </div>
                                </div>
                              )}
                              {vehicle.year && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">Year</label>
                                  <div className="text-base text-gray-900">{vehicle.year}</div>
                                </div>
                              )}
                              {vehicle.vin && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">VIN</label>
                                  <div className="text-base text-gray-900 font-mono text-sm">{vehicle.vin}</div>
                                </div>
                              )}
                              {vehicle.color && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">Color</label>
                                  <div className="text-base text-gray-900">{vehicle.color}</div>
                                </div>
                              )}
                              {vehicle.fuelType && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 block mb-1">Fuel Type</label>
                                  <div className="text-base text-gray-900">{vehicle.fuelType}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (selectedLead.vehicleMake || selectedLead.vehicleModel) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLead.vehicleMake && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">Vehicle Make</label>
                            <div className="text-base text-gray-900">{selectedLead.vehicleMake}</div>
                          </div>
                        )}
                        {selectedLead.vehicleModel && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">Vehicle Model</label>
                            <div className="text-base text-gray-900">{selectedLead.vehicleModel}</div>
                          </div>
                        )}
                        {selectedLead.vehicleDetails && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 block mb-1">Vehicle Details</label>
                            <div className="text-base text-gray-900">{selectedLead.vehicleDetails}</div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Quotation Information Section */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={20} />
                    Quotation Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Quotation Number</label>
                      <div className="text-base font-semibold text-blue-600">{selectedLead.quotationNumber}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Document Type</label>
                      <div className="text-base text-gray-900">{selectedLead.serviceType}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Total Amount</label>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{selectedLead.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Status</label>
                      <div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedLead.status)}`}>
                          {getStatusLabel(selectedLead.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center gap-2">
                        <Calendar size={16} />
                        Quotation Date
                      </label>
                      <div className="text-base text-gray-900">
                        {new Date(selectedLead.quotationDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    {selectedLead.sentToCustomerAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center gap-2">
                          <Clock size={16} />
                          Sent to Customer
                        </label>
                        <div className="text-base text-gray-900">
                          {new Date(selectedLead.sentToCustomerAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center gap-2">
                        <Clock size={16} />
                        Created At
                      </label>
                      <div className="text-base text-gray-900">
                        {new Date(selectedLead.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center gap-2">
                        <Clock size={16} />
                        Last Updated
                      </label>
                      <div className="text-base text-gray-900">
                        {new Date(selectedLead.updatedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedLead.notes && (
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <div className="text-base text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-4 border border-gray-200">
                      {selectedLead.notes}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { setShowViewModal(false); setSelectedLead(null); }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
