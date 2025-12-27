"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auditLogRepository } from "@/core/repositories/audit-log.repository";
import type { AuditLog } from "@/shared/types/audit-log.types";

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch Logs
  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => auditLogRepository.getAll(),
  });

  // Derived filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchTerm.trim() === "" ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      const matchesAction = actionFilter === "all" || log.action === actionFilter;

      return matchesSearch && matchesStatus && matchesAction;
    });
  }, [logs, searchTerm, statusFilter, actionFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="text-green-600" size={18} />;
      case "failure":
        return <XCircle className="text-red-600" size={18} />;
      case "warning":
        return <AlertTriangle className="text-orange-600" size={18} />;
      default:
        return null;
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV/Excel export
    alert("Exporting audit logs...");
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setActionFilter("all");
    refetch(); // Also refresh data
  };

  if (isLoading) {
    return (
      <div className="flex bg-gray-50 min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">Audit Logs</h1>
            <p className="text-gray-600">View and monitor all system activities</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Download size={18} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        {log.userName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="text-sm font-medium capitalize">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Audit Log Details</h2>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">User</p>
                  <p className="text-sm text-gray-800">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Action</p>
                  <p className="text-sm text-gray-800">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Entity Type</p>
                  <p className="text-sm text-gray-800">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Entity ID</p>
                  <p className="text-sm text-gray-800">{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="text-sm font-medium capitalize">{selectedLog.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Timestamp</p>
                  <p className="text-sm text-gray-800">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">IP Address</p>
                  <p className="text-sm text-gray-800">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">User Agent</p>
                  <p className="text-sm text-gray-800">{selectedLog.userAgent || '-'}</p>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Details</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedLog.details}</p>
                </div>
              )}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
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

