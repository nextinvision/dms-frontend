"use client";
import { useState, useEffect } from "react";
import {
  DollarSign,
  ClipboardList,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Wrench,
  Truck,
  FileText,
  PlusCircle,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

export default function SCDashboard() {
  const [userRole, setUserRole] = useState("sc_manager");
  const [serviceCenter, setServiceCenter] = useState("Pune Phase 1");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole") || "sc_manager";
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setUserRole(role);
      if (userInfo.serviceCenter) {
        setServiceCenter(userInfo.serviceCenter);
      }
    }
  }, []);

  // Dashboard data based on role
  const getDashboardData = () => {
    const baseData = {
      sc_manager: {
        cards: [
          {
            title: "Today's Revenue",
            value: "₹45,000",
            change: "+12.5%",
            icon: DollarSign,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
          {
            title: "Active Job Cards",
            value: "12",
            change: "+2",
            icon: ClipboardList,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Pending Approvals",
            value: "3",
            change: "Urgent",
            icon: CheckCircle,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Low Stock Items",
            value: "4",
            change: "Alert",
            icon: Package,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
          {
            title: "Technician Utilization",
            value: "78%",
            change: "+5%",
            icon: Users,
            color: "from-purple-400/20 to-purple-100",
            text: "text-purple-600",
          },
          {
            title: "Pending Invoices",
            value: "7",
            change: "₹85,000",
            icon: FileText,
            color: "from-yellow-400/20 to-yellow-100",
            text: "text-yellow-600",
          },
        ],
        alerts: [
          {
            icon: AlertTriangle,
            color: "text-red-500 border-red-500",
            title: "Low stock alert - Brake pads (2 units remaining)",
            time: "30 min ago",
            action: "Request Parts",
          },
          {
            icon: CheckCircle,
            color: "text-blue-500 border-blue-500",
            title: "Service request pending approval - ₹3,500",
            time: "1 hour ago",
            action: "Review",
          },
          {
            icon: Clock,
            color: "text-yellow-500 border-yellow-500",
            title: "Job Card #JC-2025-045 delayed - Parts pending",
            time: "2 hours ago",
            action: "View",
          },
        ],
        quickActions: [
          {
            label: "Create Job Card",
            icon: PlusCircle,
            bg: "bg-gradient-to-r from-green-500 to-green-700",
            link: "/sc/job-cards?action=create",
          },
          {
            label: "Search Vehicle",
            icon: Package,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/sc/vehicle-search",
          },
          {
            label: "Approve Requests",
            icon: CheckCircle,
            bg: "bg-gradient-to-r from-orange-500 to-yellow-500",
            link: "/sc/approvals",
          },
          {
            label: "Generate Invoice",
            icon: FileText,
            bg: "bg-gradient-to-r from-purple-500 to-pink-500",
            link: "/sc/invoices?action=create",
          },
        ],
        stats: {
          jobsCompletedToday: 5,
          jobsInProgress: 8,
          jobsPending: 4,
          revenueThisWeek: "₹2,45,000",
          revenueThisMonth: "₹8,90,000",
        },
      },
      sc_staff: {
        cards: [
          {
            title: "Today's Jobs",
            value: "8",
            change: "+2",
            icon: ClipboardList,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Pending Invoices",
            value: "5",
            change: "₹45,000",
            icon: FileText,
            color: "from-yellow-400/20 to-yellow-100",
            text: "text-yellow-600",
          },
          {
            title: "OTC Orders Today",
            value: "12",
            change: "+3",
            icon: ShoppingCart,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "Create Job Card",
            icon: PlusCircle,
            bg: "bg-gradient-to-r from-green-500 to-green-700",
            link: "/sc/job-cards?action=create",
          },
          {
            label: "Search Vehicle",
            icon: Package,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/sc/vehicle-search",
          },
          {
            label: "OTC Order",
            icon: ShoppingCart,
            bg: "bg-gradient-to-r from-orange-500 to-yellow-500",
            link: "/sc/otc-orders?action=create",
          },
        ],
      },
      service_engineer: {
        cards: [
          {
            title: "My Active Jobs",
            value: "3",
            change: "In Progress",
            icon: Wrench,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Completed Today",
            value: "2",
            change: "Good",
            icon: CheckCircle,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
          {
            title: "Pending Parts",
            value: "1",
            change: "Waiting",
            icon: Package,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "View My Jobs",
            icon: ClipboardList,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/sc/job-cards",
          },
          {
            label: "Request Parts",
            icon: Package,
            bg: "bg-gradient-to-r from-green-500 to-green-700",
            link: "/sc/parts-request",
          },
        ],
      },
    };

    return baseData[userRole] || baseData.sc_manager;
  };

  const dashboardData = getDashboardData();

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Service Center Dashboard</h1>
            <p className="text-gray-500">
              Welcome to <span className="font-semibold text-purple-600">{serviceCenter}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <span className="bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {dashboardData.cards.map((c, idx) => (
            <div
              key={idx}
              className={`rounded-2xl bg-gradient-to-tr ${c.color} p-5 shadow-md hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${c.text} bg-white shadow-sm`}>
                  <c.icon size={24} />
                </div>
                <span className="text-sm text-gray-500">{c.change}</span>
              </div>
              <h2 className={`text-2xl font-bold ${c.text}`}>{c.value}</h2>
              <p className="text-sm text-gray-600 mt-1">{c.title}</p>
            </div>
          ))}
        </div>

        {/* Stats & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Alerts */}
          {dashboardData.alerts && dashboardData.alerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-purple-700" size={20} />
                Real-time Alerts
              </h3>
              <div className="space-y-4">
                {dashboardData.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full border ${alert.color} flex items-center justify-center`}
                      >
                        <alert.icon className={`${alert.color}`} size={20} />
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm leading-snug">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                    <Link
                      href={alert.link || "#"}
                      className="bg-gradient-to-r from-blue-700 to-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg shadow hover:opacity-90"
                    >
                      {alert.action}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-pink-600 mb-4 flex items-center gap-2">
              <PlusCircle className="text-pink-600" size={20} />
              Quick Actions
            </h3>
            <div className="space-y-4">
              {dashboardData.quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  href={action.link}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${action.bg} text-white p-2 rounded-lg flex items-center justify-center`}
                    >
                      <action.icon size={20} />
                    </div>
                    <p className="text-gray-800 font-medium">{action.label}</p>
                  </div>
                  <span className="text-gray-600 text-sm hover:text-gray-800">➜</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats for SC Manager */}
        {userRole === "sc_manager" && dashboardData.stats && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-700" size={20} />
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Jobs Completed Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats.jobsCompletedToday}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Jobs In Progress</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.stats.jobsInProgress}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Revenue This Week</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats.revenueThisWeek}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Revenue This Month</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData.stats.revenueThisMonth}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

