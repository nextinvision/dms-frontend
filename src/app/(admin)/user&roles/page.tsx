"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Trash, Key, History, Edit, Power, Eye, ArrowLeft, Users, 
  ShieldAlert, Box, Banknote, Headset, Search, Filter, 
  Building2, Briefcase, Plus, MoreVertical, X
} from "lucide-react";
import { toast } from "react-hot-toast";

// Services
import { serviceCenterService } from "@/features/service-centers/services/service-center.service";
import { userService } from "@/features/users/services/user.service";

// Types
import type { User as BackendUser } from "@/shared/types/user.types";
import type { ServiceCenter as BackendServiceCenter } from "@/shared/types/service-center.types";
import type { UserRole } from "@/shared/types/auth.types";

// UI Types
interface UIUser {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: string;
  originalRole: UserRole;
  assigned: string;
  serviceCenterId?: string;
  status: "Active" | "Inactive";
}

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  status: "Active" | "Inactive";
  serviceCenter: string;
}

// Global Roles configuration
const GLOBAL_ROLES = ["Super Admin", "Call Center", "Central Inventory Mgr", "Finance Manager"];

const GLOBAL_GROUPS = [
    { id: 'global-admin', name: 'Administration', role: 'Super Admin', icon: ShieldAlert, description: 'System administrators & oversight' },
    { id: 'global-inventory', name: 'Central Inventory', role: 'Central Inventory Mgr', icon: Box, description: 'Inventory & stock management' },
    { id: 'global-call-center', name: 'Call Center', role: 'Call Center', icon: Headset, description: 'Customer support & inquiries' },
];

const ROLE_MAPPING_UI_TO_BACKEND: Record<string, UserRole> = {
  "Super Admin": "admin",
  "SC Manager": "sc_manager",
  "Finance Manager": "inventory_manager",
  "Central Inventory Mgr": "central_inventory_manager",
  "Call Center": "call_center",
  "Technician Engineer": "service_engineer",
  "Service Advisor": "service_advisor"
};

const ROLE_MAPPING_BACKEND_TO_UI: Record<string, string> = {
  "admin": "Super Admin",
  "sc_manager": "SC Manager",
  "inventory_manager": "Finance Manager",
  "call_center": "Call Center",
  "service_engineer": "Technician Engineer",
  "service_advisor": "Service Advisor",
  "central_inventory_manager": "Central Inventory Mgr"
};

interface UserGroup {
  id: string;
  name: string;
  isVirtual: boolean;
  roleTarget?: string;
  userCount: number;
  icon?: any;
  description?: string;
}

export default function UsersAndRolesPage() {
  // Navigation & Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [editingUser, setEditingUser] = useState<UIUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Future toggle if needed

  // Data State
  const [users, setUsers] = useState<UIUser[]>([]);
  const [centers, setCenters] = useState<BackendServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard Filters (Group Level)
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<'All' | 'Departments' | 'ServiceCenters'>('All');

  // Navigation Filters (User Level)
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  // Interaction State
  const [selectedUser, setSelectedUser] = useState<UIUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UIUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Array<{ action: string; timestamp: string; details: string }>>([]);

  const [formData, setFormData] = useState<UserFormData>({
    fullName: "",
    email: "",
    password: "",
    role: "Super Admin",
    status: "Active",
    serviceCenter: "",
  });

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedCenters, fetchedUsers] = await Promise.all([
        serviceCenterService.getAll(),
        userService.getAll()
      ]);

      setCenters(fetchedCenters);

      const mappedUsers: UIUser[] = fetchedUsers.map(u => {
        const sc = fetchedCenters.find(c => c.id === u.serviceCenterId);
        const assignedName = sc ? sc.name : (u.role === 'call_center' ? 'Global / Call Center' : 'Headquarters');

        return {
          id: u.id,
          initials: u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
          name: u.name,
          email: u.email,
          role: ROLE_MAPPING_BACKEND_TO_UI[u.role] || u.role,
          originalRole: u.role,
          assigned: assignedName,
          serviceCenterId: u.serviceCenterId,
          status: "Active"
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Error loading user data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Derived State: Groups ---
  const filteredGroups = useMemo(() => {
    const term = groupSearchTerm.toLowerCase();

    // 1. Global Groups
    const globalGroups: UserGroup[] = GLOBAL_GROUPS.map(g => ({
        id: g.id,
        name: g.name,
        isVirtual: true,
        roleTarget: g.role,
        icon: g.icon,
        description: g.description,
        userCount: users.filter(u => u.role === g.role).length
    })).filter(g => 
        (groupTypeFilter === 'All' || groupTypeFilter === 'Departments') &&
        (g.name.toLowerCase().includes(term) || g.roleTarget?.toLowerCase().includes(term))
    );

    // 2. Service Centers
    const scGroups: UserGroup[] = centers.map(center => ({
        id: center.id,
        name: center.name,
        isVirtual: false,
        icon: Building2,
        description: `${center.city}, ${center.state}`,
        userCount: users.filter(u => u.serviceCenterId === center.id).length
    })).filter(c => 
        (groupTypeFilter === 'All' || groupTypeFilter === 'ServiceCenters') &&
        (c.name.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term))
    );

    return { globalGroups, scGroups };
  }, [centers, users, groupSearchTerm, groupTypeFilter]);

  // --- Derived State: Users in Selected Group ---
  const filteredUsers = useMemo(() => {
    if (!selectedGroup) return [];

    let groupUsers = [];
    
    if (selectedGroup.isVirtual && selectedGroup.roleTarget) {
        groupUsers = users.filter(u => u.role === selectedGroup.roleTarget);
    } else {
        groupUsers = users.filter(u => u.serviceCenterId === selectedGroup.id);
    }

    if (userSearchTerm.trim() !== "") {
        groupUsers = groupUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }

    if (userRoleFilter !== "All") {
        groupUsers = groupUsers.filter((u) => u.role === userRoleFilter);
    }

    return groupUsers;
  }, [selectedGroup, users, userSearchTerm, userRoleFilter]);

  // --- Handlers ---

  const handleGroupClick = (group: UserGroup) => {
    setSelectedGroup(group);
    setUserSearchTerm("");
    setUserRoleFilter("All");
    setUserStatusFilter("All");
  };

  const handleEditUser = (user: UIUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.name,
      email: user.email,
      password: "", 
      role: user.role,
      status: user.status,
      serviceCenter: user.serviceCenterId || "",
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Clear SC if global role selected
    if (name === "role" && GLOBAL_ROLES.includes(value)) {
      setFormData(prev => ({ ...prev, [name]: value, serviceCenter: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const backendRole = ROLE_MAPPING_UI_TO_BACKEND[formData.role] || "service_engineer";
      const payload: any = {
        name: formData.fullName,
        email: formData.email,
        role: backendRole,
        serviceCenterId: formData.serviceCenter || null,
      };

      if (editingUser) {
        if (formData.password) payload.password = formData.password;
        await userService.update(editingUser.id, payload);
        await fetchData();
        toast.success("User updated successfully");
      } else {
        if (!formData.password) {
          toast.error("Password is required for new users");
          return;
        }
        payload.password = formData.password;
        await userService.create(payload);
        await fetchData();
        toast.success("User created successfully");
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save user", error);
      toast.error("Failed to save user. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({ fullName: "", email: "", password: "", role: "Super Admin", status: "Active", serviceCenter: "" });
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await userService.delete(userToDelete.id);
        await fetchData();
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        if (selectedUser?.id === userToDelete.id) {
          setShowUserDetails(false);
          setSelectedUser(null);
        }
        toast.success("User deleted successfully");
      } catch (error) {
        console.error("Failed to delete user", error);
        toast.error("Failed to delete user");
      }
    }
  };

  // Mock Utils
  const loadActivityLogs = (user: UIUser) => {
    setActivityLogs([
      { action: "Login", timestamp: "2024-11-15 10:30 AM", details: "Logged in from Chrome on Windows" },
      { action: "View Job Cards", timestamp: "2024-11-15 10:35 AM", details: "Viewed 12 job cards" },
    ]);
    setShowActivityLogs(true);
  };

  if (loading && users.length === 0 && centers.length === 0) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-50 text-gray-500">Loading user management...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {selectedGroup ? selectedGroup.name : "User Management"}
          </h1>
          <p className="text-gray-500 mt-1">
            {selectedGroup 
              ? selectedGroup.isVirtual ? 'Manage global role permissions and users' : 'Manage service center staff and access'
              : "Overview of all departments and service centers"}
          </p>
        </div>

        {selectedGroup && (
           <div className="flex items-center gap-3">
             <button
               onClick={() => setSelectedGroup(null)}
               className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
             >
               <ArrowLeft size={18} />
               <span>Back to Dashboard</span>
             </button>
             <button
                onClick={() => {
                  setEditingUser(null);
                  if (selectedGroup.isVirtual && selectedGroup.roleTarget) {
                     setFormData({
                        fullName: "", email: "", password: "",
                        role: selectedGroup.roleTarget, status: "Active", serviceCenter: "",
                     });
                  } else {
                     setFormData({
                        fullName: "", email: "", password: "",
                        role: "Service Advisor", status: "Active", serviceCenter: selectedGroup.id,
                     });
                  }
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
              >
                <Plus size={18} />
                <span>Add User</span>
              </button>
           </div>
        )}
      </div>

      {/* --- DASHBOARD VIEW (GROUPS) --- */}
      {!selectedGroup ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search departments or centers..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                  value={groupSearchTerm}
                  onChange={(e) => setGroupSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <FilterButton label="All Groups" active={groupTypeFilter === 'All'} onClick={() => setGroupTypeFilter('All')} />
                <FilterButton label="Departments" active={groupTypeFilter === 'Departments'} onClick={() => setGroupTypeFilter('Departments')} icon={<Briefcase size={16}/>} />
                <FilterButton label="Service Centers" active={groupTypeFilter === 'ServiceCenters'} onClick={() => setGroupTypeFilter('ServiceCenters')} icon={<Building2 size={16}/>} />
            </div>
          </div>

          {/* 1. Global Departments Section */}
          {(groupTypeFilter === 'All' || groupTypeFilter === 'Departments') && filteredGroups.globalGroups.length > 0 && (
             <section>
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold text-lg">
                    <Briefcase size={20} className="text-purple-600"/>
                    <h2>Administrative Departments</h2>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredGroups.globalGroups.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                   {filteredGroups.globalGroups.map(group => (
                       <GroupCard key={group.id} group={group} onClick={() => handleGroupClick(group)} variant="purple" />
                   ))}
                </div>
             </section>
          )}

          {/* 2. Service Centers Section */}
          {(groupTypeFilter === 'All' || groupTypeFilter === 'ServiceCenters') && filteredGroups.scGroups.length > 0 && (
             <section>
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold text-lg">
                    <Building2 size={20} className="text-blue-600"/>
                    <h2>Service Centers</h2>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredGroups.scGroups.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                   {filteredGroups.scGroups.map(group => (
                       <GroupCard key={group.id} group={group} onClick={() => handleGroupClick(group)} variant="blue" />
                   ))}
                </div>
             </section>
          )}
          
          {/* Empty State */}
          {filteredGroups.globalGroups.length === 0 && filteredGroups.scGroups.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Search size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
          )}
        </div>
      ) : (
        /* --- USER LIST VIEW --- */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
               <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search users by name or email..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                   />
               </div>
               {!selectedGroup.isVirtual && (
                   <div className="flex items-center gap-2">
                       <Filter size={18} className="text-gray-400" />
                       <select 
                         className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                         value={userRoleFilter}
                         onChange={(e) => setUserRoleFilter(e.target.value)}
                       >
                           <option value="All">All Roles</option>
                           {Object.values(ROLE_MAPPING_BACKEND_TO_UI).map(role => (
                                <option key={role} value={role}>{role}</option>
                           ))}
                       </select>
                   </div>
               )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Profile</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${selectedGroup.isVirtual ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                                    {user.initials}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedGroup.isVirtual ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                Active
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditUser(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => { setSelectedUser(user); setShowUserDetails(true); }} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Details">
                                    <Eye size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setShowDeleteConfirm(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <Users size={48} className="mb-3 opacity-20" />
                                    <p className="text-lg font-medium text-gray-900">No users found</p>
                                    <p className="text-sm">Try adjusting your search criteria</p>
                                </div>
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">{editingUser ? "Edit User" : "Create New User"}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Password {editingUser && <span className="font-normal text-gray-400 normal-case">(Optional for updates)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                    <div className="relative">
                        <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none bg-white"
                        >
                        {Object.keys(ROLE_MAPPING_UI_TO_BACKEND).map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><MoreVertical size={14}/></div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service Center</label>
                     <div className="relative">
                        <select
                        name="serviceCenter"
                        value={formData.serviceCenter}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={(!!selectedGroup && !editingUser) || GLOBAL_ROLES.includes(formData.role)}
                        >
                        <option value="">{GLOBAL_ROLES.includes(formData.role) ? "N/A (Global)" : "Select..."}</option>
                        {centers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        </select>
                     </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                    {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Other Modals (Delete, Details, etc) */}
      <ConfirmDeleteModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} userName={userToDelete?.name} />
      <UserDetailsModal isOpen={showUserDetails} onClose={() => setShowUserDetails(false)} user={selectedUser} onResetPass={() => setShowPasswordReset(true)} onLog={() => selectedUser && loadActivityLogs(selectedUser)} />
      <SimpleModal isOpen={showPasswordReset} onClose={() => setShowPasswordReset(false)} title="Reset Password" content="Password reset functionality is currently simulated." />
      <ActivityLogModal isOpen={showActivityLogs} onClose={() => setShowActivityLogs(false)} logs={activityLogs} />

    </div>
  );
}

// --- Sub-components for Cleaner Code ---

function FilterButton({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon?: any }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
            ${active ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
            {icon}
            {label}
        </button>
    )
}

function GroupCard({ group, onClick, variant }: { group: UserGroup, onClick: () => void, variant: 'blue' | 'purple' }) {
    const Icon = group.icon || Users;
    const isPurple = variant === 'purple';
    
    return (
        <div 
            onClick={onClick}
            className={`
                group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
                ${isPurple ? 'hover:border-purple-200' : 'hover:border-blue-200'}
            `}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon size={80} className={isPurple ? 'text-purple-600' : 'text-blue-600'} />
            </div>

            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm ${isPurple ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{group.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">{group.description || 'View users'}</p>
                
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isPurple ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {group.userCount} Members
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${isPurple ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        <ArrowLeft size={16} className="rotate-180" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, userName }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
                    <Trash size={24} />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Delete User?</h3>
                <p className="text-gray-500 text-center text-sm mb-6">Are you sure you want to delete <strong>{userName}</strong>? This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 shadow-lg shadow-red-200">Delete</button>
                </div>
            </div>
        </div>
    )
}

function UserDetailsModal({ isOpen, onClose, user, onResetPass, onLog }: any) {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-center text-white">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold mx-auto mb-3 backdrop-blur-sm border border-white/20">
                        {user.initials}
                    </div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-white/60 text-sm">{user.email}</p>
                </div>
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500 text-sm">Role</span>
                            <span className="font-medium text-gray-900">{user.role}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500 text-sm">Assignment</span>
                            <span className="font-medium text-gray-900">{user.assigned}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500 text-sm">Status</span>
                            <span className="font-medium text-green-600">Active</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onResetPass} className="flex items-center justify-center gap-2 py-2.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"><Key size={16}/> Reset Pass</button>
                        <button onClick={onLog} className="flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"><History size={16}/> View Logs</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SimpleModal({ isOpen, onClose, title, content }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-600 mb-4">{content}</p>
                <button onClick={onClose} className="w-full py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">Close</button>
            </div>
        </div>
    )
}

function ActivityLogModal({ isOpen, onClose, logs }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold">Activity Logs</h3>
                 <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
               </div>
               <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                   {logs.map((log: any, i:number) => (
                       <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="mt-1"><History size={16} className="text-gray-400"/></div>
                           <div>
                               <p className="font-medium text-gray-900 text-sm">{log.action}</p>
                               <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                               <p className="text-[10px] text-gray-400 mt-1">{log.timestamp}</p>
                           </div>
                       </div>
                   ))}
               </div>
            </div>
        </div>
    )
}
