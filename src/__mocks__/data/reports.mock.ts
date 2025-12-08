/**
 * Mock data for Reports
 */

export interface Report {
  id: string;
  reportType: string;
  title: string;
  generatedDate: string;
  period: string;
  serviceCenterId: string;
  serviceCenterName: string;
  totalJobs?: number;
  totalRevenue?: string;
  totalCustomers?: number;
  status: "Generated" | "Pending";
}

/**
 * Default reports list
 */
export const defaultReports: Report[] = [
  {
    id: "RPT-001",
    reportType: "Monthly Performance",
    title: "Monthly Performance Report - January 2025",
    generatedDate: "2025-01-31",
    period: "January 2025",
    serviceCenterId: "1",
    serviceCenterName: "Delhi Central Hub",
    totalJobs: 45,
    totalRevenue: "₹2.5L",
    totalCustomers: 38,
    status: "Generated",
  },
  {
    id: "RPT-002",
    reportType: "Revenue Report",
    title: "Revenue Report - Q4 2024",
    generatedDate: "2024-12-31",
    period: "Q4 2024",
    serviceCenterId: "1",
    serviceCenterName: "Delhi Central Hub",
    totalRevenue: "₹8.2L",
    status: "Generated",
  },
  {
    id: "RPT-003",
    reportType: "Customer Satisfaction",
    title: "Customer Satisfaction Report - January 2025",
    generatedDate: "2025-01-31",
    period: "January 2025",
    serviceCenterId: "2",
    serviceCenterName: "Mumbai Metroplex",
    totalCustomers: 52,
    status: "Generated",
  },
  {
    id: "RPT-004",
    reportType: "Service Report",
    title: "Service Report - January 2025",
    generatedDate: "2025-01-31",
    period: "January 2025",
    serviceCenterId: "2",
    serviceCenterName: "Mumbai Metroplex",
    totalJobs: 68,
    totalRevenue: "₹3.8L",
    status: "Generated",
  },
  {
    id: "RPT-005",
    reportType: "Monthly Performance",
    title: "Monthly Performance Report - January 2025",
    generatedDate: "2025-01-31",
    period: "January 2025",
    serviceCenterId: "3",
    serviceCenterName: "Bangalore Innovation Center",
    totalJobs: 32,
    totalRevenue: "₹1.9L",
    totalCustomers: 28,
    status: "Generated",
  },
  {
    id: "RPT-006",
    reportType: "Inventory Report",
    title: "Inventory Report - January 2025",
    generatedDate: "2025-01-31",
    period: "January 2025",
    serviceCenterId: "3",
    serviceCenterName: "Bangalore Innovation Center",
    status: "Pending",
  },
];

