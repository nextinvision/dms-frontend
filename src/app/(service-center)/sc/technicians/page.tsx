"use client";
import { useState, useMemo } from "react";
import { Users, UserPlus, X, Plus, XCircle, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/shared/hooks";
import { userRepository } from "@/core/repositories/user.repository";
import { useToast } from "@/core/contexts/ToastContext";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { normalizeServiceCenterId } from "@/shared/utils/service-center.utils";

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  currentJobs: number;
  completedToday: number;
  utilization: number;
  skills: string[];
  activeJobDetails: {
    id: string;
    number: string;
    vehicle: string;
    status: string;
  }[];
}

export default function Technicians() {
  const { userRole } = useRole();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);

  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [technicianForm, setTechnicianForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "Available",
    skills: [] as string[],
  });
  const [currentSkill, setCurrentSkill] = useState<string>("");

  // State for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<string | null>(null);

  // Fetch Technicians
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['technicians', serviceCenterContext.serviceCenterId],
    queryFn: () => userRepository.getAll({
      role: 'service_engineer',
      serviceCenterId: serviceCenterContext.serviceCenterId,
      includeJobCards: 'true'
    }),
  });

  // Calculate stats and format data
  const technicians: Technician[] = useMemo(() => {
    if (!Array.isArray(users)) return [];

    const today = new Date().toISOString().split('T')[0];

    return users.map((user: any) => {
      const activeJobsList = user.jobCards?.filter((jc: any) =>
        ['JOB_CARD_ACTIVE', 'IN_PROGRESS', 'ASSIGNED'].includes(jc.status)
      ) || [];

      const activeJobDetails = activeJobsList.map((jc: any) => ({
        id: jc.id,
        number: jc.jobCardNumber,
        vehicle: jc.vehicle ? `${jc.vehicle.registration} (${jc.vehicle.vehicleMake} ${jc.vehicle.vehicleModel})` : 'Unknown Vehicle',
        status: jc.status.replace(/_/g, ' ')
      }));

      const activeJobs = activeJobsList.length;

      const completedToday = user.jobCards?.filter((jc: any) =>
        (jc.status === 'COMPLETED' || jc.status === 'INVOICED') &&
        (jc.updatedAt?.startsWith(today) || jc.createdAt?.startsWith(today)) // Fallback if updatedAt not updated properly
      ).length || 0;

      // Simple mock utilization calculation based on active jobs
      // Assuming max capacity of 3 concurrent jobs = 100%
      const utilization = Math.min(Math.round((activeJobs / 3) * 100), 100);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        status: activeJobs > 0 ? "Busy" : "Available",
        currentJobs: activeJobs,
        completedToday,
        utilization,
        skills: [], // Skills are not yet supported by backend
        activeJobDetails
      };
    });
  }, [users]);

  // Create Technician Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => userRepository.create({
      ...data,
      role: 'service_engineer',
      serviceCenterId: serviceCenterContext.serviceCenterId
    }),
    onSuccess: () => {
      showSuccess("Technician added successfully");
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowAddModal(false);
      setTechnicianForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        status: "Available",
        skills: [],
      });
      setCurrentSkill("");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to create technician");
    }
  });

  // Delete Technician Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userRepository.delete(id),
    onSuccess: async (_, deletedId) => {
      // Close modal first
      setShowDeleteModal(false);
      setTechnicianToDelete(null);
      
      // Show success message
      showSuccess("Technician deleted successfully");
      
      // Optimistically update the cache by removing the deleted technician
      // Handle both with and without serviceCenterId in the query key
      const queryKeyWithId = ['technicians', serviceCenterContext.serviceCenterId];
      const queryKeyWithoutId = ['technicians'];
      
      // Update cache for query with serviceCenterId
      queryClient.setQueryData(queryKeyWithId, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter((user: any) => user.id !== deletedId);
      });
      
      // Update cache for query without serviceCenterId (fallback)
      queryClient.setQueryData(queryKeyWithoutId, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter((user: any) => user.id !== deletedId);
      });
      
      // Invalidate all technician queries to trigger refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['technicians'],
        exact: false
      });
      
      // Force refetch to ensure we have the latest data from server
      await queryClient.refetchQueries({ 
        queryKey: ['technicians'],
        exact: false,
        type: 'active' // Only refetch active queries
      });
    },
    onError: (error: any) => {
      // On error, invalidate to refetch and restore correct state
      queryClient.invalidateQueries({ 
        queryKey: ['technicians'],
        exact: false
      });
      showError(error.response?.data?.message || "Failed to delete technician");
    }
  });

  const handleDeleteClick = (id: string) => {
    setTechnicianToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (technicianToDelete) {
      deleteMutation.mutate(technicianToDelete);
    }
  };


const handleSubmit = () => {
  if (!technicianForm.name || !technicianForm.email || !technicianForm.password) {
    showError("Please fill in all required fields (Name, Email, Password)");
    return;
  }

  createMutation.mutate({
    name: technicianForm.name,
    email: technicianForm.email,
    password: technicianForm.password,
    phone: technicianForm.phone,
    // Note: Skills and Status (manual) are not sent as backend controls status via jobs
  });
};

return (
  <div className="bg-[#f9f9fb] min-h-screen">
    <div className="pt-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Technicians</h1>
          <p className="text-gray-500">Manage service engineers and their assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add Technician
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
        </div>
      ) : technicians.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Technicians Found</h3>
          <p className="text-gray-500 mb-6">Add your first service engineer to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-blue-600 font-medium hover:text-blue-700 underline"
          >
            Add a technician now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl ring-4 ring-white shadow-sm">
                    {tech.name.split(" ")[0][0] || "E"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{tech.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-flex items-center ${tech.status === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tech.status === 'Busy' ? 'bg-orange-500' : 'bg-green-500'
                          }`}></span>
                        {tech.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteClick(tech.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Technician"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Active Job Section */}
              {tech.activeJobDetails.length > 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Working On</p>
                  {tech.activeJobDetails.slice(0, 2).map((job, idx) => (
                    <div key={job.id} className={`${idx > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{job.number}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1 truncate" title={job.vehicle}>
                        {job.vehicle}
                      </p>
                    </div>
                  ))}
                  {tech.activeJobDetails.length > 2 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">+ {tech.activeJobDetails.length - 2} more</p>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Queue</span>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{tech.currentJobs} Jobs</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Done Today</span>
                  <span className="font-semibold text-gray-900">{tech.completedToday}</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Daily Load</span>
                    <span className="font-medium text-gray-700">{tech.utilization}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tech.utilization > 80 ? 'bg-red-500' :
                        tech.utilization > 50 ? 'bg-orange-400' : 'bg-green-500'
                        }`}
                      style={{ width: `${tech.utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Add Technician Modal */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto p-4 md:p-6 z-[101]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add Technician</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600 transition p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={technicianForm.name}
                    onChange={(e) => setTechnicianForm({ ...technicianForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={technicianForm.email}
                    onChange={(e) => setTechnicianForm({ ...technicianForm, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={technicianForm.phone}
                    onChange={(e) => setTechnicianForm({ ...technicianForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={technicianForm.password}
                    onChange={(e) => setTechnicianForm({ ...technicianForm, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Skills (Visual Only as backend support is pending) */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Skills</h3>
                <span className="text-xs text-gray-500">(Optional - for display only)</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && currentSkill.trim()) {
                        e.preventDefault();
                        if (!technicianForm.skills.includes(currentSkill.trim())) {
                          setTechnicianForm({
                            ...technicianForm,
                            skills: [...technicianForm.skills, currentSkill.trim()],
                          });
                          setCurrentSkill("");
                        }
                      }
                    }}
                    placeholder="Enter skill and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (currentSkill.trim() && !technicianForm.skills.includes(currentSkill.trim())) {
                        setTechnicianForm({
                          ...technicianForm,
                          skills: [...technicianForm.skills, currentSkill.trim()],
                        });
                        setCurrentSkill("");
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                {technicianForm.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {technicianForm.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => {
                            setTechnicianForm({
                              ...technicianForm,
                              skills: technicianForm.skills.filter((_, i) => i !== index),
                            });
                          }}
                          className="hover:text-blue-900"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition flex justify-center items-center gap-2"
              >
                {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                Add Technician
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Technician?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this technician? This action cannot be undone and may affect active job cards assigned to them.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition flex justify-center items-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

