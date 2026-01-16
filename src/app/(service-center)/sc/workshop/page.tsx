"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  UserPlus,
  AlertTriangle,
  User,
  Package,
  X,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { Engineer, WorkshopStats, EngineerStatus, Workload, Priority, JobCard, JobCardStatus } from "@/shared/types";
import { useToast } from "@/shared/utils/toast.util";
// import { localStorage as safeStorage } from "@/shared/lib/localStorage";

import { filterByServiceCenter, getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { staffService } from "@/features/workshop/services/staff.service";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";

// Load default data
const defaultJobCards: JobCard[] = [];
// const defaultEngineers: Engineer[] = []; // Removed mock engineers


// Define a UI-specific JobCard type that has resolved strings for display
interface WorkshopJobCard extends Omit<JobCard, 'vehicle' | 'assignedEngineer'> {
  vehicle: string;
  assignedEngineer: string;
}

interface WorkshopAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
}

export default function Workshop() {
  const { showSuccess, showWarning, showError } = useToast();
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedJobForAction, setSelectedJobForAction] = useState<WorkshopJobCard | null>(null);
  const [selectedEngineerForAssign, setSelectedEngineerForAssign] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<WorkshopJobCard | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for data
  const [jobCards, setJobCards] = useState<WorkshopJobCard[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);

  // Fetch data from backend
  // Fetch data from backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch engineers and job cards in parallel
      const serviceCenterId = serviceCenterContext.serviceCenterId?.toString();
      const [fetchedEngineers, fetchedJobCards] = await Promise.all([
        staffService.getEngineers(serviceCenterId),
        jobCardService.getAll({ serviceCenterId })
      ]);

      setEngineers(fetchedEngineers);

      // Normalize job cards to ensure UI compatibility
      const normalizedJobCards = (fetchedJobCards || []).map((job: any) => ({
        ...job,
        // Ensure critical fields exist
        jobCardNumber: job.jobCardNumber || job.id || "",
        // Handle potential nested objects from backend (e.g. customer: { name: ... })
        customerName: job.customerName || job.customer?.name || "Unknown Customer",
        vehicle: (typeof job.vehicle === 'object' && job.vehicle !== null)
          ? String(job.vehicle.vehicleModel || job.vehicle.registration || "Unknown Vehicle")
          : String(job.vehicle || job.vehicleDetails?.model || (job.vehicleId ? `Vehicle ${job.vehicleId}` : "Unknown Vehicle")),
        registration: String(job.registration || job.vehicleDetails?.registrationNumber || ""),
        serviceType: String(job.serviceType || job.description || "General Service"),
        status: job.status || "CREATED",
        priority: job.priority || "NORMAL",
        assignedEngineer: (typeof job.assignedEngineer === 'object' && job.assignedEngineer !== null)
          ? String(job.assignedEngineer?.name || "")
          : String(job.assignedEngineer || job.engineer?.name || ""),
        parts: job.parts || [],
      }));

      setJobCards(normalizedJobCards);
    } catch (error) {
      console.error("Error fetching workshop data:", error);
      showError("Failed to load workshop data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceCenterContext]);

  // Derived state: Visible job cards (filtered by context if needed, but API usually handles it)
  const visibleJobCards = useMemo(
    () => filterByServiceCenter(jobCards, serviceCenterContext),
    [jobCards, serviceCenterContext]
  );

  // Filter to show only active job cards - INCLUDES CREATED/OPEN/IN_PROGRESS/PARTS_PENDING
  const activeJobCards = useMemo(() => {
    return visibleJobCards.filter((job) =>
      job.status === "CREATED" ||

      job.status === "ASSIGNED" ||
      job.status === "IN_PROGRESS" ||
      job.status === "PARTS_PENDING"
    );
  }, [visibleJobCards]);

  // Engineers (fetched from API above)

  // Filter active jobs based on filters and search
  const filteredActiveJobs = useMemo(() => {
    return activeJobCards.filter((job) => {
      const status = job.status || "";
      const priority = job.priority || "";

      const matchesStatus = filterStatus === "all" || status.toLowerCase() === filterStatus.toLowerCase();
      const matchesPriority = filterPriority === "all" || priority.toLowerCase() === filterPriority.toLowerCase();

      if (!searchQuery) return matchesStatus && matchesPriority;

      const query = searchQuery.toLowerCase();
      // Robust search check
      const matchesSearch =
        (job.id && String(job.id).toLowerCase().includes(query)) ||
        (job.jobCardNumber && String(job.jobCardNumber).toLowerCase().includes(query)) ||
        (job.customerName && String(job.customerName).toLowerCase().includes(query)) ||
        (job.vehicle && String(job.vehicle).toLowerCase().includes(query)) ||
        (job.registration && String(job.registration).toLowerCase().includes(query)) ||
        (job.serviceType && String(job.serviceType).toLowerCase().includes(query)) ||
        (job.assignedEngineer && String(job.assignedEngineer).toLowerCase().includes(query));

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [activeJobCards, filterStatus, filterPriority, searchQuery]);

  // Update workshop stats based on actual job cards
  const workshopStats: WorkshopStats = useMemo(() => {
    const totalBays = 6;
    const activeCount = activeJobCards.length;
    const occupiedBays = Math.min(activeCount, totalBays);
    const completedToday = visibleJobCards.filter(
      (job) => (job.status === "COMPLETED") &&
        job.completedAt &&
        new Date(job.completedAt).toDateString() === new Date().toDateString()
    ).length;

    return {
      totalBays,
      occupiedBays,
      availableBays: Math.max(0, totalBays - occupiedBays),
      activeJobs: activeCount,
      completedToday,
      averageServiceTime: "2.5 hours", // This would ideally be calculated
      utilizationRate: Math.round((occupiedBays / totalBays) * 100),
    };
  }, [activeJobCards, visibleJobCards]);

  // Dynamic Alerts
  const workshopAlerts = useMemo(() => {
    const alerts: WorkshopAlert[] = [];

    // 1. High Workload Check
    engineers.forEach(engineer => {
      const activeJobCount = activeJobCards.filter(
        job => job.assignedEngineer && String(job.assignedEngineer).includes(engineer.name) && job.status !== 'COMPLETED'
      ).length;

      if (activeJobCount > 3) {
        alerts.push({
          id: `workload-${engineer.id}`,
          type: 'warning',
          title: 'High Workload Detected',
          message: `${engineer.name} has ${activeJobCount} active jobs`
        });
      }
    });

    // 2. Parts Pending Check
    const partsPendingJobs = activeJobCards.filter(job => job.status === 'PARTS_PENDING');
    if (partsPendingJobs.length > 0) {
      partsPendingJobs.forEach(job => {
        alerts.push({
          id: `parts-${job.id}`,
          type: 'info',
          title: 'Parts Pending',
          message: `${job.jobCardNumber || job.id} is waiting for parts`
        });
      });
    }

    // 3. Unassigned Jobs (High Priority)
    const unassignedCriticalJobs = activeJobCards.filter(
      job => (!job.assignedEngineer || String(job.assignedEngineer).trim() === '') &&
        (job.priority === 'HIGH' || job.priority === 'CRITICAL')
    );

    if (unassignedCriticalJobs.length > 0) {
      alerts.push({
        id: `unassigned-critical`,
        type: 'error',
        title: 'Unassigned High Priority Jobs',
        message: `${unassignedCriticalJobs.length} high priority jobs need assignment`
      });
    }

    return alerts;
  }, [engineers, activeJobCards]);




  const handleAssignEngineer = async () => {
    if (!selectedJobForAction || !selectedEngineerForAssign) {
      showWarning("Please select a job and engineer");
      return;
    }

    try {
      setIsLoading(true);
      const engineer = engineers.find((e) => e.id.toString() === selectedEngineerForAssign);

      if (!engineer) {
        showError("Engineer not found");
        return;
      }

      // Use API
      await jobCardService.assignEngineer(selectedJobForAction.id, engineer.id.toString(), engineer.name);

      showSuccess("Engineer assigned successfully!");
      setShowAssignModal(false);
      setSelectedJobForAction(null);
      setSelectedEngineerForAssign("");

      // Refresh data to reflect changes
      await fetchData();
    } catch (error) {
      console.error("Error assigning engineer:", error);
      showError("Failed to assign engineer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedJobForAction) {
      showWarning("Please select a job to complete");
      return;
    }

    try {
      setIsLoading(true);
      // Use API
      await jobCardService.updateStatus(selectedJobForAction.id, "COMPLETED");

      showSuccess("Job marked as completed!");
      setShowCompleteModal(false);
      setSelectedJobForAction(null);

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error completing job:", error);
      showError("Failed to complete job");
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: JobCardStatus): string => {
    const colors: Record<string, string> = {
      CREATED: "bg-gray-100 text-gray-700 border-gray-300",
      ASSIGNED: "bg-blue-100 text-blue-700 border-blue-300",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-300",
      COMPLETED: "bg-green-100 text-green-700 border-green-300",
      INVOICED: "bg-purple-100 text-purple-700 border-purple-300",
      // Add other statuses if needed or map them
    };
    return (colors as any)[status] || colors.CREATED;
  };

  const getPriorityColor = (priority: Priority): string => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-500",
      NORMAL: "bg-blue-500",
      HIGH: "bg-orange-500",
      CRITICAL: "bg-red-500",
    };
    return (colors as any)[priority] || colors.NORMAL;
  };

  const getEngineerStatusColor = (status: EngineerStatus): string => {
    return status === "Available"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };


  const getWorkloadColor = (workload: Workload): string => {
    const colors: Record<Workload, string> = {
      Low: "bg-green-500",
      Medium: "bg-yellow-500",
      High: "bg-red-500",
    };
    return colors[workload] || colors.Medium;
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Workshop Management</h1>
          <p className="text-gray-500">Monitor workshop operations and engineer assignments</p>
        </div>

        {/* Workshop Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Wrench size={24} />
              </div>
              <span className="text-sm text-gray-500">Capacity</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {workshopStats.occupiedBays}/{workshopStats.totalBays}
            </h2>
            <p className="text-sm text-gray-600">Bays Occupied</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {workshopStats.completedToday}
            </h2>
            <p className="text-sm text-gray-600">Jobs Completed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Clock size={24} />
              </div>
              <span className="text-sm text-gray-500">Average</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {workshopStats.averageServiceTime}
            </h2>
            <p className="text-sm text-gray-600">Service Time</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm text-gray-500">Utilization</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {workshopStats.utilizationRate}%
            </h2>
            <p className="text-sm text-gray-600">Workshop Capacity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engineers List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Jobs */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Wrench className="text-blue-600" size={24} />
                  Active Jobs
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredActiveJobs.length} {filteredActiveJobs.length === 1 ? "job" : "jobs"}
                </span>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by job ID, customer, vehicle, or service type..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredActiveJobs.length > 0 ? (
                  filteredActiveJobs.map((job) => {
                    // Determine which fields have data
                    const hasJobCardNumber = job.jobCardNumber && String(job.jobCardNumber).trim() !== "";
                    const hasCustomerName = job.customerName && String(job.customerName).trim() !== "";
                    const hasVehicle = job.vehicle && String(job.vehicle).trim() !== "";
                    const hasRegistration = job.registration && String(job.registration).trim() !== "";
                    const hasServiceType = job.serviceType && String(job.serviceType).trim() !== "";
                    const hasAssignedEngineer = job.assignedEngineer && String(job.assignedEngineer).trim() !== "";
                    const hasEstimatedTime = job.estimatedTime && String(job.estimatedTime).trim() !== "";
                    const hasEstimatedCost = job.estimatedCost && String(job.estimatedCost).trim() !== "";
                    const hasParts = job.parts && Array.isArray(job.parts) && job.parts.length > 0;

                    return (
                      <div
                        key={job.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDetails(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                {job.id}
                              </span>
                              {hasJobCardNumber && (
                                <span className="text-xs text-gray-500">{job.jobCardNumber}</span>
                              )}
                              {job.status && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    job.status
                                  )}`}
                                >
                                  {job.status}
                                </span>
                              )}
                              {job.priority && (
                                <span
                                  className={`w-2 h-2 rounded-full ${getPriorityColor(job.priority)}`}
                                  title={job.priority}
                                ></span>
                              )}
                            </div>
                            {hasCustomerName && (
                              <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {job.customerName}
                              </p>
                            )}
                            {(hasVehicle || hasRegistration) && (
                              <p className="text-sm text-gray-600 mt-1">
                                {hasVehicle && hasRegistration
                                  ? `${job.vehicle} • ${job.registration}`
                                  : hasVehicle
                                    ? job.vehicle
                                    : job.registration}
                              </p>
                            )}
                          </div>
                        </div>
                        {(hasServiceType || hasAssignedEngineer || hasEstimatedTime || hasEstimatedCost) && (
                          <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                            {hasServiceType && (
                              <div className="flex items-center gap-2">
                                <Wrench size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{job.serviceType}</span>
                              </div>
                            )}
                            {hasAssignedEngineer && (
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{job.assignedEngineer}</span>
                              </div>
                            )}
                            {hasEstimatedTime && (
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">{job.estimatedTime}</span>
                              </div>
                            )}
                            {hasEstimatedCost && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Cost:</span>
                                <span className="font-medium text-gray-800">{job.estimatedCost}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {hasParts && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Package size={12} className="text-gray-400" />
                              <span>{job.parts.length} {job.parts.length === 1 ? "part" : "parts"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Wrench className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="font-medium">No active jobs found</p>
                    <p className="text-sm mt-1">
                      {searchQuery ? "Try adjusting your search criteria" : "No jobs are currently active"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Engineer Performance */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="text-purple-600" size={24} />
                Engineer Performance
              </h2>
              <div className="space-y-4">
                {engineers.map((engineer) => (
                  <div
                    key={engineer.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedEngineer(engineer)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {engineer.name.split(" ")[1] || "E"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{engineer.name}</p>
                          <p className="text-xs text-gray-600">{engineer.skills.join(", ")}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getEngineerStatusColor(
                          engineer.status
                        )}`}
                      >
                        {engineer.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Jobs</p>
                        <p className="font-semibold text-gray-800">{engineer.currentJobs}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed Today</p>
                        <p className="font-semibold text-gray-800">{engineer.completedToday}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Utilization</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getWorkloadColor(
                                engineer.workload
                              )}`}
                              style={{ width: `${engineer.utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {engineer.utilization}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Capacity & Quick Actions */}
          <div className="space-y-6">
            {/* Capacity Overview */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                Capacity Overview
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Bays</span>
                    <span className="font-semibold text-gray-800">
                      {workshopStats.totalBays}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: workshopStats.totalBays }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-8 rounded ${idx < workshopStats.occupiedBays
                          ? "bg-red-500"
                          : "bg-green-500"
                          }`}
                        title={
                          idx < workshopStats.occupiedBays ? "Occupied" : "Available"
                        }
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Available Bays</span>
                    <span className="font-semibold text-green-600">
                      {workshopStats.availableBays}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Occupied Bays</span>
                    <span className="font-semibold text-red-600">
                      {workshopStats.occupiedBays}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (activeJobCards.length === 0) {
                      showWarning("No active jobs available");
                      return;
                    }
                    setShowAssignModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 transition text-left flex items-center gap-2"
                >
                  <UserPlus size={20} />
                  Assign Engineer
                </button>
                <button
                  onClick={() => {
                    if (activeJobCards.length === 0) {
                      showWarning("No active jobs available");
                      return;
                    }
                    setShowCompleteModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 transition text-left flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  Complete Job
                </button>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 transition text-left flex items-center gap-2"
                >
                  <Filter size={20} />
                  Filter Jobs
                </button>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-600" size={24} />
                Alerts
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {workshopAlerts.length > 0 ? (
                  workshopAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-3 ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        alert.type === 'error' ? 'bg-red-50 border-red-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                    >
                      <p className={`text-sm font-medium ${alert.type === 'warning' ? 'text-yellow-800' :
                        alert.type === 'error' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-1 ${alert.type === 'warning' ? 'text-yellow-600' :
                        alert.type === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                        {alert.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No active alerts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Engineer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Assign Engineer</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedJobForAction(null);
                  setSelectedEngineerForAssign("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job</label>
                <select
                  value={selectedJobForAction?.id || ""}
                  onChange={(e) => {
                    const job = activeJobCards.find((j) => j.id === e.target.value);
                    setSelectedJobForAction(job || null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Job --</option>
                  {activeJobCards.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.id} - {job.customerName} ({job.vehicle})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Engineer</label>
                <select
                  value={selectedEngineerForAssign}
                  onChange={(e) => setSelectedEngineerForAssign(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Engineer --</option>
                  {engineers
                    .filter((e) => e.status === "Available")
                    .map((engineer) => (
                      <option key={engineer.id} value={engineer.id.toString()}>
                        {engineer.name} ({engineer.skills.join(", ")})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedJobForAction(null);
                    setSelectedEngineerForAssign("");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignEngineer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Complete Job</h2>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedJobForAction(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job to Complete</label>
                <select
                  value={selectedJobForAction?.id || ""}
                  onChange={(e) => {
                    const job = activeJobCards.find((j) => j.id === e.target.value);
                    setSelectedJobForAction(job || null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  <option value="">-- Select Job --</option>
                  {activeJobCards.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.id} - {job.customerName} ({job.vehicle})
                    </option>
                  ))}
                </select>
              </div>
              {selectedJobForAction && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Customer: <span className="font-medium">{selectedJobForAction.customerName}</span></p>
                  <p className="text-sm text-gray-600 mb-1">Vehicle: <span className="font-medium">{selectedJobForAction.vehicle}</span></p>
                  <p className="text-sm text-gray-600">Service: <span className="font-medium">{selectedJobForAction.serviceType}</span></p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedJobForAction(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Complete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Jobs Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Filter Jobs</h2>
              <button
                onClick={() => {
                  setShowFilterModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by job ID, customer, or vehicle..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="in progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="on hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Card Details Modal */}
      {showDetails && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto p-4 md:p-6 z-[101]">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Job Card Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Status and Priority */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base">
                  {selectedJob.id}
                </span>
                {selectedJob.jobCardNumber && (
                  <span className="text-xs md:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                    {selectedJob.jobCardNumber}
                  </span>
                )}
                <span
                  className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium border ${getStatusColor(
                    selectedJob.status
                  )}`}
                >
                  {selectedJob.status}
                </span>
                <span
                  className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white ${getPriorityColor(
                    selectedJob.priority
                  )}`}
                >
                  {selectedJob.priority} Priority
                </span>
              </div>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-blue-50 p-3 md:p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-1 md:mb-2 text-sm md:text-base">Customer Information</h3>
                  <p className="text-xs md:text-sm text-gray-700 break-words">{selectedJob.customerName}</p>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-1 md:mb-2 text-sm md:text-base">Vehicle Information</h3>
                  <p className="text-xs md:text-sm text-gray-700 break-words">{selectedJob.vehicle}</p>
                  <p className="text-xs text-gray-600 mt-1 break-words">{selectedJob.registration}</p>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Service Details</h3>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-700 mb-1 md:mb-2 break-words">
                    <strong>Type:</strong> {selectedJob.serviceType}
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 break-words">
                    <strong>Description:</strong> {selectedJob.description}
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 mt-2 break-words">
                    <strong>Location:</strong> {selectedJob.location}
                  </p>
                </div>
              </div>

              {/* Parts & Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Required Parts</h3>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    {selectedJob.parts && selectedJob.parts.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedJob.parts.map((part, idx) => (
                          <li key={idx} className="text-xs md:text-sm text-gray-700 flex items-center gap-1 md:gap-2 break-words">
                            <Package size={12} className="text-gray-400 flex-shrink-0" />
                            {part}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs md:text-sm text-gray-500">No parts required</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Estimates</h3>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-1 md:space-y-2">
                    <p className="text-xs md:text-sm text-gray-700 break-words">
                      <strong>Cost:</strong> {selectedJob.estimatedCost}
                    </p>
                    <p className="text-xs md:text-sm text-gray-700 break-words">
                      <strong>Time:</strong> {selectedJob.estimatedTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Engineer Assignment */}
              {selectedJob.assignedEngineer && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Assigned Engineer</h3>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs md:text-sm text-gray-700 flex items-center gap-1 md:gap-2 break-words">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      {selectedJob.assignedEngineer}
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {selectedJob.createdAt && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Created At</h3>
                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-gray-700 break-words">{selectedJob.createdAt}</p>
                    </div>
                  </div>
                )}
                {selectedJob.startTime && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">Start Time</h3>
                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-gray-700 break-words">{selectedJob.startTime}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-gray-200 transition text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

