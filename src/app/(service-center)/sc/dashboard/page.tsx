"use client";
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
  Calendar,
  Building2,
  UserCheck,
  AlertCircle,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRole } from "@/shared/hooks";
import { useState, useEffect } from "react";
import { appointmentsService } from "@/features/appointments/services/appointments.service";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { quotationsService } from "@/features/quotations/services/quotations.service";
import { invoicesService } from "@/features/invoices/services/invoices.service";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { leadsService } from "@/features/leads/services/leads.service";
import type { DashboardCard, Alert, QuickAction, UserRole } from "@/shared/types";
import type { JobCard } from "@/shared/types/job-card.types";
import type { Quotation } from "@/shared/types/quotation.types";
import type { ServiceCenterInvoice } from "@/shared/types/invoice.types";

interface DashboardData {
  cards: DashboardCard[];
  alerts: Alert[];
  quickActions: QuickAction[];
  stats?: {
    jobsCompletedToday?: number;
    jobsInProgress?: number;
    jobsPending?: number;
    revenueToday?: string;
    revenueThisWeek?: string;
    revenueThisMonth?: string;
  };
}

interface DashboardStats {
  // Job Cards
  activeJobCards: number;
  completedJobsToday: number;
  jobsInProgress: number;
  jobsPending: number;

  // Quotations
  pendingQuotations: number;
  pendingApprovals: number;

  // Appointments
  todayAppointments: number;
  pendingAppointments: number;

  // Invoices & Revenue
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  overduePayments: number;
  overdueInvoicesCount: number;

  // Inventory
  lowStockItems: number;

  // Leads
  activeLeads: number;

  // Workshop
  workshopCapacity: { used: number; total: number };
}

export default function SCDashboard() {
  const { userRole, userInfo } = useRole();
  const serviceCenter = userInfo?.serviceCenter || "Pune Phase 1";
  const serviceCenterId = userInfo?.serviceCenterId || "sc-001";

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobCards: 0,
    completedJobsToday: 0,
    jobsInProgress: 0,
    jobsPending: 0,
    pendingQuotations: 0,
    pendingApprovals: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    overduePayments: 0,
    overdueInvoicesCount: 0,
    lowStockItems: 0,
    activeLeads: 0,
    workshopCapacity: { used: 4, total: 6 },
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [serviceCenterId, userRole]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Calculate week start (Monday)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      // Calculate month start
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split("T")[0];

      // Fetch all data in parallel
      const [
        jobCards,
        quotations,
        appointments,
        invoices,
        inventory,
        leads,
      ] = await Promise.all([
        jobCardService.getAll().catch(() => []),
        quotationsService.getAll().catch(() => []),
        appointmentsService.getAll().catch(() => []),
        invoicesService.getAll().catch(() => []),
        inventoryService.getAll({ lowStock: true }).catch(() => []),
        leadsService.getAll().catch(() => []),
      ]);

      // Calculate Job Card stats
      const activeJobCards = jobCards.filter((jc: JobCard) =>
        jc.status !== "COMPLETED" && jc.status !== "INVOICED"
      ).length;

      const completedJobsToday = jobCards.filter((jc: JobCard) => {
        if (!jc.completedAt) return false;
        const completedDate = new Date(jc.completedAt).toISOString().split("T")[0];
        return jc.status === "COMPLETED" && completedDate === todayStr;
      }).length;

      const jobsInProgress = jobCards.filter((jc: JobCard) =>
        jc.status === "IN_PROGRESS"
      ).length;

      const jobsPending = jobCards.filter((jc: JobCard) =>
        jc.status === "CREATED" || jc.status === "ASSIGNED" || jc.status === "PARTS_PENDING"
      ).length;

      // Calculate Quotation stats
      const pendingQuotations = quotations.filter((q: Quotation) =>
        q.status === "DRAFT" || q.status === "SENT_TO_CUSTOMER"
      ).length;

      const pendingApprovals = quotations.filter((q: Quotation) =>
        q.status === "SENT_TO_MANAGER"
      ).length;

      // Calculate Appointment stats
      const todayAppointments = appointments.filter((apt: any) =>
        apt.date === todayStr
      ).length;

      const pendingAppointments = appointments.filter((apt: any) =>
        apt.status === "Pending" || apt.status === "Confirmed"
      ).length;

      // Calculate Revenue stats
      const calculateRevenue = (invoiceList: ServiceCenterInvoice[], startDate: string) => {
        return invoiceList
          .filter((inv) => {
            const invDate = new Date(inv.date).toISOString().split("T")[0];
            return invDate >= startDate && inv.status === "Paid";
          })
          .reduce((sum, inv) => {
            const amount = typeof inv.grandTotal === 'number'
              ? inv.grandTotal
              : parseFloat(inv.amount?.replace(/[₹,]/g, '') || '0');
            return sum + amount;
          }, 0);
      };

      const revenueToday = calculateRevenue(invoices, todayStr);
      const revenueThisWeek = calculateRevenue(invoices, weekStartStr);
      const revenueThisMonth = calculateRevenue(invoices, monthStartStr);

      // Calculate Overdue Payments
      const overdueInvoices = invoices.filter((inv) => {
        const dueDate = new Date(inv.dueDate || inv.date);
        return inv.status === "Unpaid" && dueDate < today;
      });

      const overduePayments = overdueInvoices.reduce((sum, inv) => {
        const amount = typeof inv.grandTotal === 'number'
          ? inv.grandTotal
          : parseFloat(inv.balance?.replace(/[₹,]/g, '') || '0');
        return sum + amount;
      }, 0);

      // Calculate Inventory stats
      const lowStockItems = inventory.filter((item: any) =>
        item.status === "Low Stock" || item.stockQuantity <= item.minStockLevel
      ).length;

      // Calculate Leads stats
      const activeLeads = leads.filter((lead: any) =>
        lead.status === "NEW" || lead.status === "IN_DISCUSSION"
      ).length;

      // Generate dynamic alerts
      const dynamicAlerts = generateAlerts({
        lowStockItems,
        inventory,
        pendingApprovals,
        quotations,
        overdueInvoicesCount: overdueInvoices.length,
        jobCards,
        activeLeads,
      });

      setStats({
        activeJobCards,
        completedJobsToday,
        jobsInProgress,
        jobsPending,
        pendingQuotations,
        pendingApprovals,
        todayAppointments,
        pendingAppointments,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        overduePayments,
        overdueInvoicesCount: overdueInvoices.length,
        lowStockItems,
        activeLeads,
        workshopCapacity: { used: jobsInProgress, total: 6 },
      });

      setAlerts(dynamicAlerts);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAlerts = (data: any): Alert[] => {
    const alerts: Alert[] = [];

    // Low stock alerts
    if (data.lowStockItems > 0 && data.inventory.length > 0) {
      const firstLowStock = data.inventory[0];
      alerts.push({
        icon: AlertTriangle,
        color: "text-red-500 border-red-500",
        title: `Low stock alert - ${firstLowStock.partName || 'Parts'} (${firstLowStock.stockQuantity || 0} units remaining)`,
        time: "Recent",
        action: "Request Parts",
      });
    }

    // Active leads alert
    if (data.activeLeads > 0) {
      alerts.push({
        icon: UserCheck,
        color: "text-cyan-500 border-cyan-500",
        title: `${data.activeLeads} active leads need attention`,
        time: "Recent",
        action: "View",
      });
    }

    // Pending approvals alert
    if (data.pendingApprovals > 0) {
      const pendingQuotation = data.quotations.find((q: Quotation) =>
        q.status === "SENT_TO_MANAGER"
      );
      const amount = pendingQuotation?.totalAmount || 0;
      alerts.push({
        icon: CheckCircle,
        color: "text-blue-500 border-blue-500",
        title: `${data.pendingApprovals} quotation(s) pending approval - ₹${amount.toLocaleString('en-IN')}`,
        time: "Recent",
        action: "Review",
      });
    }

    // Delayed job cards
    const delayedJobs = data.jobCards.filter((jc: JobCard) => {
      // Try multiple sources for expected completion date
      const expectedDateStr = jc.expectedCompletionDate || jc.part1?.estimatedDeliveryDate;
      if (!expectedDateStr) return false; // Skip if no expected date is set

      const expectedDate = new Date(expectedDateStr);
      return jc.status === "IN_PROGRESS" && expectedDate < new Date();
    });

    if (delayedJobs.length > 0) {
      const firstDelayed = delayedJobs[0];
      alerts.push({
        icon: Clock,
        color: "text-yellow-500 border-yellow-500",
        title: `Job Card ${firstDelayed.jobCardNumber} delayed`,
        time: "Recent",
        action: "View",
      });
    }

    // Overdue invoices
    if (data.overdueInvoicesCount > 0) {
      alerts.push({
        icon: AlertCircle,
        color: "text-red-500 border-red-500",
        title: `${data.overdueInvoicesCount} overdue invoice(s) need follow-up`,
        time: "Recent",
        action: "View",
      });
    }

    return alerts;
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getDashboardData = (): DashboardData => {
    const quickActions: QuickAction[] = [
      {
        label: "Create Job Card",
        icon: PlusCircle,
        bg: "bg-gradient-to-r from-green-500 to-green-700",
        link: "/sc/job-cards?action=create",
      },
      {
        label: "Generate Invoice",
        icon: FileText,
        bg: "bg-gradient-to-r from-purple-500 to-pink-500",
        link: "/sc/invoices?action=create",
      },
      {
        label: "View Pending Approvals",
        icon: CheckCircle,
        bg: "bg-gradient-to-r from-orange-500 to-yellow-500",
        link: "/sc/approvals",
      },
      {
        label: "Check Appointments",
        icon: Calendar,
        bg: "bg-gradient-to-r from-teal-500 to-cyan-500",
        link: "/sc/appointments",
      },
    ];

    const baseData: Record<UserRole, DashboardData> = {
      sc_manager: {
        cards: [
          {
            title: "Today's Revenue",
            value: formatCurrency(stats.revenueToday),
            change: stats.revenueToday > 0 ? `+${((stats.revenueToday / (stats.revenueThisMonth || 1)) * 100).toFixed(1)}%` : "0%",
            icon: DollarSign,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
          {
            title: "Services Completed Today",
            value: stats.completedJobsToday.toString(),
            change: stats.completedJobsToday > 0 ? `+${stats.completedJobsToday}` : "0",
            icon: CheckCircle,
            color: "from-emerald-400/20 to-emerald-100",
            text: "text-emerald-600",
          },
          {
            title: "Active Job Cards",
            value: stats.activeJobCards.toString(),
            change: stats.jobsInProgress > 0 ? `${stats.jobsInProgress} in progress` : "None",
            icon: ClipboardList,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Pending Approvals",
            value: stats.pendingApprovals.toString(),
            change: stats.pendingApprovals > 0 ? "Urgent" : "None",
            icon: CheckCircle,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Workshop Capacity",
            value: `${stats.workshopCapacity.used}/${stats.workshopCapacity.total}`,
            change: `${stats.workshopCapacity.total - stats.workshopCapacity.used} Available`,
            icon: Building2,
            color: "from-indigo-400/20 to-indigo-100",
            text: "text-indigo-600",
          },
          {
            title: "Overdue Payments",
            value: formatCurrency(stats.overduePayments),
            change: `${stats.overdueInvoicesCount} invoices`,
            icon: AlertCircle,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
          {
            title: "Low Stock Items",
            value: stats.lowStockItems.toString(),
            change: stats.lowStockItems > 0 ? "Alert" : "Good",
            icon: Package,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
        ],
        alerts: alerts,
        quickActions: quickActions,
        stats: {
          jobsCompletedToday: stats.completedJobsToday,
          jobsInProgress: stats.jobsInProgress,
          jobsPending: stats.jobsPending,
          revenueToday: formatCurrency(stats.revenueToday),
          revenueThisWeek: formatCurrency(stats.revenueThisWeek),
          revenueThisMonth: formatCurrency(stats.revenueThisMonth),
        },
      },
      service_engineer: {
        cards: [
          {
            title: "My Active Jobs",
            value: stats.jobsInProgress.toString(),
            change: "In Progress",
            icon: ClipboardList,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Jobs Pending",
            value: stats.jobsPending.toString(),
            change: "Pending",
            icon: Package,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Completed Today",
            value: stats.completedJobsToday.toString(),
            change: "Done",
            icon: Truck,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
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
            bg: "bg-gradient-to-r from-orange-500 to-yellow-500",
            link: "/sc/parts-request",
          },
        ],
      },
      service_advisor: {
        cards: [
          {
            title: "Active Leads",
            value: stats.activeLeads.toString(),
            change: stats.activeLeads > 0 ? `+${stats.activeLeads}` : "0",
            icon: Users,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Pending Quotations",
            value: stats.pendingQuotations.toString(),
            change: stats.pendingQuotations > 0 ? "Urgent" : "None",
            icon: FileText,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Today's Appointments",
            value: stats.todayAppointments.toString(),
            change: stats.todayAppointments > 0 ? `+${stats.todayAppointments}` : "0",
            icon: Clock,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "Create Lead",
            icon: PlusCircle,
            bg: "bg-gradient-to-r from-green-500 to-green-700",
            link: "/sc/leads?action=create",
          },
          {
            label: "Create Quotation",
            icon: FileText,
            bg: "bg-gradient-to-r from-purple-500 to-pink-500",
            link: "/sc/quotations?action=create",
          },
        ],
      },
      call_center: {
        cards: [
          {
            title: "Pending Appointments",
            value: stats.pendingAppointments.toString(),
            change: "Today",
            icon: Clock,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Today's Appointments",
            value: stats.todayAppointments.toString(),
            change: "Scheduled",
            icon: TrendingUp,
            color: "from-green-400/20 to-green-100",
            text: "text-green-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "Schedule Appointment",
            icon: Clock,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/sc/appointments?action=create",
          },
        ],
      },
      admin: {
        cards: [
          {
            title: "Total Revenue (SC)",
            value: formatCurrency(stats.revenueToday),
            change: stats.revenueToday > 0 ? `+${((stats.revenueToday / (stats.revenueThisMonth || 1)) * 100).toFixed(1)}%` : "0%",
            icon: DollarSign,
            color: "from-purple-400/20 to-purple-100",
            text: "text-purple-600",
          },
          {
            title: "Services Completed",
            value: stats.completedJobsToday.toString(),
            change: stats.completedJobsToday > 0 ? `+${stats.completedJobsToday}` : "0",
            icon: CheckCircle,
            color: "from-emerald-400/20 to-emerald-100",
            text: "text-emerald-600",
          },
          {
            title: "Active Job Cards",
            value: stats.activeJobCards.toString(),
            change: stats.jobsInProgress > 0 ? `${stats.jobsInProgress} in progress` : "None",
            icon: ClipboardList,
            color: "from-blue-400/20 to-blue-100",
            text: "text-blue-600",
          },
          {
            title: "Pending Approvals",
            value: stats.pendingApprovals.toString(),
            change: stats.pendingApprovals > 0 ? "Urgent" : "None",
            icon: CheckCircle,
            color: "from-orange-400/20 to-orange-100",
            text: "text-orange-600",
          },
          {
            title: "Workshop Capacity",
            value: `${stats.workshopCapacity.used}/${stats.workshopCapacity.total}`,
            change: `${stats.workshopCapacity.total - stats.workshopCapacity.used} Available`,
            icon: Building2,
            color: "from-indigo-400/20 to-indigo-100",
            text: "text-indigo-600",
          },
          {
            title: "Overdue Payments",
            value: formatCurrency(stats.overduePayments),
            change: `${stats.overdueInvoicesCount} invoices`,
            icon: AlertCircle,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
          {
            title: "Low Stock Items",
            value: stats.lowStockItems.toString(),
            change: stats.lowStockItems > 0 ? "Alert" : "Good",
            icon: Package,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
        ],
        alerts: alerts,
        quickActions: quickActions,
        stats: {
          jobsCompletedToday: stats.completedJobsToday,
          jobsInProgress: stats.jobsInProgress,
          jobsPending: stats.jobsPending,
          revenueToday: formatCurrency(stats.revenueToday),
          revenueThisWeek: formatCurrency(stats.revenueThisWeek),
          revenueThisMonth: formatCurrency(stats.revenueThisMonth),
        },
      },
      inventory_manager: {
        cards: [
          {
            title: "Low Stock Items",
            value: stats.lowStockItems.toString(),
            change: stats.lowStockItems > 0 ? "Alert" : "Good",
            icon: Package,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "Manage Inventory",
            icon: Package,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/sc/inventory",
          },
        ],
      },
      central_inventory_manager: {
        cards: [
          {
            title: "Low Stock Items",
            value: stats.lowStockItems.toString(),
            change: stats.lowStockItems > 0 ? "Alert" : "Good",
            icon: Package,
            color: "from-red-400/20 to-red-100",
            text: "text-red-600",
          },
        ],
        alerts: [],
        quickActions: [
          {
            label: "Manage Central Inventory",
            icon: Package,
            bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            link: "/central-inventory",
          },
        ],
      },
    };

    return baseData[userRole] || baseData.sc_manager;
  };

  const dashboardData = getDashboardData();

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Service Center Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Assigned center: {serviceCenter}</p>
        </div>

        {/* Revenue Summary Section */}
        {dashboardData.stats && (userRole === "sc_manager" || userRole === "admin") && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={20} strokeWidth={2} />
              Revenue Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-5 border border-emerald-200/50 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {dashboardData.stats.revenueToday}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-5 border border-blue-200/50 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-blue-700">
                  {dashboardData.stats.revenueThisWeek}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg p-5 border border-indigo-200/50 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {dashboardData.stats.revenueThisMonth}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {dashboardData.cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl bg-white border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-lg ${card.text} bg-gradient-to-br ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{card.change}</span>
                </div>
                <h2 className={`text-2xl font-bold ${card.text} mb-1`}>{card.value}</h2>
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData.alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={20} strokeWidth={2} />
                Alerts
              </h3>
              <div className="space-y-3">
                {dashboardData.alerts.map((alert, idx) => {
                  const Icon = alert.icon;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50/50 p-4 rounded-lg hover:bg-gray-50 transition-all duration-150 border border-gray-100"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-lg border ${alert.color} bg-white flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={alert.color} size={18} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm leading-snug">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                      {alert.action && (
                        <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 ml-3 flex-shrink-0">
                          {alert.action}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PlusCircle className="text-indigo-600" size={20} strokeWidth={2} />
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              {dashboardData.quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    href={action.link}
                    className="flex items-center justify-between bg-gray-50/50 rounded-lg p-4 hover:bg-indigo-50/50 transition-all duration-150 border border-gray-100 hover:border-indigo-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${action.bg} text-white p-2 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <p className="text-gray-900 font-medium text-sm group-hover:text-indigo-700 transition-colors">{action.label}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-indigo-600 text-sm transition-colors">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

