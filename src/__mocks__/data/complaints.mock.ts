/**
 * Mock data for Customer Complaints
 */

export interface Complaint {
  id: string;
  customerName: string;
  phone: string;
  vehicle: string;
  complaint: string;
  status: "Open" | "Resolved" | "Closed";
  date: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  serviceCenterId?: string;
  serviceCenterName?: string;
}

/**
 * Default complaints list for the complaints page
 * In a real app, this would be fetched from an API
 */
export const defaultComplaints: Complaint[] = [
  {
    id: "COMP-001",
    customerName: "Rajesh Kumar",
    phone: "9876543210",
    vehicle: "Honda City",
    complaint: "Service quality was poor. The technician did not properly diagnose the issue.",
    status: "Open",
    date: "2025-01-15",
    severity: "Medium",
    serviceCenterId: "1",
    serviceCenterName: "Delhi Central Hub",
  },
  {
    id: "COMP-002",
    customerName: "Priya Sharma",
    phone: "9876543211",
    vehicle: "Maruti Swift",
    complaint: "Delayed service delivery. Vehicle was promised to be ready in 2 days but took 5 days.",
    status: "Resolved",
    date: "2024-12-20",
    severity: "High",
    serviceCenterId: "1",
    serviceCenterName: "Delhi Central Hub",
  },
  {
    id: "COMP-003",
    customerName: "Amit Patel",
    phone: "9876543212",
    vehicle: "Hyundai i20",
    complaint: "Parts were not available and had to wait for 3 days without vehicle.",
    status: "Open",
    date: "2025-01-18",
    severity: "High",
    serviceCenterId: "2",
    serviceCenterName: "Mumbai Metroplex",
  },
  {
    id: "COMP-004",
    customerName: "Sneha Reddy",
    phone: "9876543213",
    vehicle: "Toyota Innova",
    complaint: "Billing amount was higher than the estimated quote provided initially.",
    status: "Closed",
    date: "2024-12-10",
    severity: "Low",
    serviceCenterId: "2",
    serviceCenterName: "Mumbai Metroplex",
  },
  {
    id: "COMP-005",
    customerName: "Vikram Singh",
    phone: "9876543214",
    vehicle: "Tata Nexon",
    complaint: "Technician arrived late for home service appointment.",
    status: "Open",
    date: "2025-01-20",
    severity: "Medium",
    serviceCenterId: "3",
    serviceCenterName: "Bangalore Innovation Center",
  },
  {
    id: "COMP-006",
    customerName: "Anjali Mehta",
    phone: "9876543215",
    vehicle: "Mahindra XUV",
    complaint: "Vehicle was returned with scratches that were not present before service.",
    status: "Open",
    date: "2025-01-22",
    severity: "Critical",
    serviceCenterId: "3",
    serviceCenterName: "Bangalore Innovation Center",
  },
];

/**
 * Get mock complaints for a customer
 * In a real app, this would be fetched from an API
 */
export const getMockComplaints = (customerName: string, phone: string, vehicle?: string): Complaint[] => {
  const defaultVehicle = vehicle || "N/A";
  
  return [
    {
      id: "COMP-001",
      customerName,
      phone,
      vehicle: defaultVehicle,
      complaint: "Service quality was poor. The technician did not properly diagnose the issue.",
      status: "Open",
      date: "2025-01-15",
      severity: "Medium",
    },
    {
      id: "COMP-002",
      customerName,
      phone,
      vehicle: defaultVehicle,
      complaint: "Delayed service delivery. Vehicle was promised to be ready in 2 days but took 5 days.",
      status: "Resolved",
      date: "2024-12-20",
      severity: "High",
    },
  ];
};

