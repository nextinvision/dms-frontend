"use client";
import { useState } from "react";
import {
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  Wrench,
  CheckCircle,
  AlertCircle,
  Package,
  FileText,
  Eye,
  Edit,
  X,
  Car,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import type { JobCard, JobCardStatus, Priority, KanbanColumn } from "@/shared/types";

type ViewType = "kanban" | "list";
type FilterType = "all" | "created" | "assigned" | "in_progress" | "completed";

export default function JobCards() {
  const [view, setView] = useState<ViewType>("kanban");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Mock job cards data
  const [jobCards, setJobCards] = useState<JobCard[]>([
    {
      id: "JC-2025-001",
      customerName: "Rajesh Kumar",
      vehicle: "Honda City 2020",
      registration: "PB10AB1234",
      serviceType: "Routine Maintenance",
      description: "Regular service - oil change, filter replacement",
      status: "In Progress",
      priority: "Normal",
      assignedEngineer: "Engineer 1",
      estimatedCost: "₹3,500",
      estimatedTime: "2 hours",
      startTime: "2025-01-15 10:00",
      createdAt: "2025-01-15 09:30",
      parts: ["Engine Oil", "Air Filter"],
      location: "Station",
    },
    {
      id: "JC-2025-002",
      customerName: "Priya Sharma",
      vehicle: "Maruti Swift 2019",
      registration: "MH01XY5678",
      serviceType: "Repair",
      description: "Brake pads replacement",
      status: "Assigned",
      priority: "High",
      assignedEngineer: "Engineer 2",
      estimatedCost: "₹4,200",
      estimatedTime: "3 hours",
      createdAt: "2025-01-15 11:15",
      parts: ["Brake Pads", "Brake Fluid"],
      location: "Station",
    },
    {
      id: "JC-2025-003",
      customerName: "Amit Patel",
      vehicle: "Hyundai i20 2021",
      registration: "DL05CD9012",
      serviceType: "Inspection",
      description: "Pre-purchase inspection",
      status: "Created",
      priority: "Normal",
      assignedEngineer: null,
      estimatedCost: "₹1,500",
      estimatedTime: "1 hour",
      createdAt: "2025-01-15 14:20",
      parts: [],
      location: "Station",
    },
    {
      id: "JC-2025-004",
      customerName: "Suresh Kumar",
      vehicle: "Toyota Innova 2020",
      registration: "KA03EF3456",
      serviceType: "Repair",
      description: "AC repair and gas refill",
      status: "Completed",
      priority: "High",
      assignedEngineer: "Engineer 1",
      estimatedCost: "₹5,500",
      estimatedTime: "4 hours",
      completedAt: "2025-01-15 16:30",
      createdAt: "2025-01-15 12:00",
      parts: ["AC Gas", "AC Filter"],
      location: "Home Service",
    },
  ]);

  const getStatusColor = (status: JobCardStatus): string => {
    const colors: Record<JobCardStatus, string> = {
      Created: "bg-gray-100 text-gray-700 border-gray-300",
      Assigned: "bg-blue-100 text-blue-700 border-blue-300",
      "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-300",
      "Parts Pending": "bg-orange-100 text-orange-700 border-orange-300",
      Completed: "bg-green-100 text-green-700 border-green-300",
      Invoiced: "bg-purple-100 text-purple-700 border-purple-300",
    };
    return colors[status] || colors.Created;
  };

  const getPriorityColor = (priority: Priority): string => {
    const colors: Record<Priority, string> = {
      Low: "bg-gray-500",
      Normal: "bg-blue-500",
      High: "bg-orange-500",
      Critical: "bg-red-500",
    };
    return colors[priority] || colors.Normal;
  };

  const filteredJobs = jobCards.filter((job) => {
    if (filter === "all") return true;
    return job.status.toLowerCase().replace(" ", "_") === filter;
  });

  const kanbanColumns: KanbanColumn[] = [
    { id: "created", title: "Created", status: "Created" },
    { id: "assigned", title: "Assigned", status: "Assigned" },
    { id: "in_progress", title: "In Progress", status: "In Progress" },
    { id: "parts_pending", title: "Parts Pending", status: "Parts Pending" },
    { id: "completed", title: "Completed", status: "Completed" },
  ];

  const getJobsByStatus = (status: JobCardStatus): JobCard[] => {
    return filteredJobs.filter((job) => job.status === status);
  };

  const handleStatusChange = (jobId: string, newStatus: JobCardStatus): void => {
    setJobCards(
      jobCards.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    );
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Job Cards</h1>
            <p className="text-gray-500">Manage and track service job cards</p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
              <button
                onClick={() => setView("kanban")}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  view === "kanban"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                List
              </button>
            </div>
            <Link
              href="/sc/job-cards?action=create"
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Create Job Card
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by job card ID, customer name, vehicle..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "created", "assigned", "in_progress", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban View */}
        {view === "kanban" && (
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-max">
              {kanbanColumns.map((column) => {
                const columnJobs = getJobsByStatus(column.status);
                return (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-80 bg-white rounded-xl shadow-md p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">
                        {column.title}
                      </h3>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                        {columnJobs.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {columnJobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition cursor-pointer"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowDetails(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">
                                {job.id}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {job.customerName}
                              </p>
                            </div>
                            <span
                              className={`w-2 h-2 rounded-full ${getPriorityColor(
                                job.priority
                              )}`}
                              title={job.priority}
                            ></span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <Car size={14} />
                            <span>{job.vehicle}</span>
                          </div>
                          <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              <Clock size={12} className="inline mr-1" />
                              {job.estimatedTime}
                            </span>
                            <span className="font-medium text-gray-800">
                              {job.estimatedCost}
                            </span>
                          </div>
                          {job.assignedEngineer && (
                            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-600">
                              <User size={12} />
                              <span>{job.assignedEngineer}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {columnJobs.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No jobs
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {job.id}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                      <span
                        className={`w-3 h-3 rounded-full ${getPriorityColor(
                          job.priority
                        )}`}
                        title={job.priority}
                      ></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User size={18} className="text-gray-400" />
                        <span className="font-medium">{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Car size={18} className="text-gray-400" />
                        <span>{job.vehicle}</span>
                        <span className="text-gray-500">• {job.registration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Wrench size={18} className="text-gray-400" />
                        <span>{job.serviceType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={18} className="text-gray-400" />
                        <span>{job.createdAt}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-2">{job.description}</p>

                    <div className="flex items-center gap-4 text-sm">
                      {job.assignedEngineer && (
                        <span className="text-gray-500">
                          Engineer: <span className="font-medium text-gray-700">{job.assignedEngineer}</span>
                        </span>
                      )}
                      <span className="text-gray-500">
                        Estimated: <span className="font-medium text-gray-700">{job.estimatedCost}</span>
                      </span>
                      <span className="text-gray-500">
                        Time: <span className="font-medium text-gray-700">{job.estimatedTime}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDetails(true);
                        }}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition inline-flex items-center gap-2"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition inline-flex items-center gap-2">
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>
                    {job.status === "Created" && (
                      <button
                        onClick={() => handleStatusChange(job.id, "Assigned")}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                      >
                        Assign Engineer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Job Cards Found</h3>
            <p className="text-gray-500">No job cards match the current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Job Card Details Modal */}
      {showDetails && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Job Card Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                  {selectedJob.id}
                </span>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                    selectedJob.status
                  )}`}
                >
                  {selectedJob.status}
                </span>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${getPriorityColor(
                    selectedJob.priority
                  )}`}
                >
                  {selectedJob.priority} Priority
                </span>
              </div>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-2">Customer Information</h3>
                  <p className="text-sm text-gray-700">{selectedJob.customerName}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-2">Vehicle Information</h3>
                  <p className="text-sm text-gray-700">{selectedJob.vehicle}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedJob.registration}</p>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Type:</strong> {selectedJob.serviceType}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Description:</strong> {selectedJob.description}
                  </p>
                </div>
              </div>

              {/* Parts & Estimates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Required Parts</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedJob.parts.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedJob.parts.map((part, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                            <Package size={14} className="text-gray-400" />
                            {part}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No parts required</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Estimates</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Cost:</strong> {selectedJob.estimatedCost}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Time:</strong> {selectedJob.estimatedTime}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Location:</strong> {selectedJob.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Engineer Assignment */}
              {selectedJob.assignedEngineer && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Assigned Engineer</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      {selectedJob.assignedEngineer}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Close
                </button>
                {selectedJob.status === "Created" && (
                  <button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
                    Assign Engineer
                  </button>
                )}
                {selectedJob.status === "In Progress" && (
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
                    Mark as Completed
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

