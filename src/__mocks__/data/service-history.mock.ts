import { mockCustomers } from "./customers.mock";

const [rajesh, priya, amit] = mockCustomers;

export interface ServiceHistoryItem {
  id: string;
  serviceDate: string;
  serviceType: string;
  engineerName: string;
  partsUsed: string[];
  laborCharges: string;
  partsCharges: string;
  totalAmount: string;
  invoiceNumber: string;
  jobCardId: string;
}

type ExtendedServiceHistoryItem = ServiceHistoryItem & {
  customerExternalId: string;
  vehicleExternalId?: string;
};

const perCustomerServiceHistory: Record<string, ExtendedServiceHistoryItem[]> = {
  "cust-001": [
    {
      id: "SH001",
      serviceDate: "2024-10-15",
      serviceType: "Full Service",
      engineerName: "Technician Raj",
      partsUsed: ["Engine Oil 5L", "Air Filter", "Spark Plugs"],
      laborCharges: "₹1500",
      partsCharges: "₹2500",
      totalAmount: "₹4000",
      invoiceNumber: "INV-2024-045",
      jobCardId: "JC001",
      customerExternalId: "cust-001",
      vehicleExternalId: rajesh.vehicles[0].externalId,
    },
    {
      id: "SH002",
      serviceDate: "2024-07-10",
      serviceType: "Maintenance",
      engineerName: "Technician Priya",
      partsUsed: ["Engine Oil 5L", "Coolant 5L"],
      laborCharges: "₹1000",
      partsCharges: "₹1500",
      totalAmount: "₹2500",
      invoiceNumber: "INV-2024-032",
      jobCardId: "JC002",
      customerExternalId: "cust-001",
      vehicleExternalId: rajesh.vehicles[1].externalId,
    },
    {
      id: "SH003",
      serviceDate: "2024-04-05",
      serviceType: "Repair",
      engineerName: "Technician Raj",
      partsUsed: ["Brake Pads", "Brake Fluid"],
      laborCharges: "₹2000",
      partsCharges: "₹3000",
      totalAmount: "₹5000",
      invoiceNumber: "INV-2024-018",
      jobCardId: "JC003",
      customerExternalId: "cust-001",
      vehicleExternalId: rajesh.vehicles[0].externalId,
    },
  ],
  "cust-002": [
    {
      id: "SH004",
      serviceDate: "2024-09-20",
      serviceType: "Full Service",
      engineerName: "Technician Amit",
      partsUsed: ["Engine Oil 5L", "Air Filter"],
      laborCharges: "₹1200",
      partsCharges: "₹1800",
      totalAmount: "₹3000",
      invoiceNumber: "INV-2024-038",
      jobCardId: "JC004",
      customerExternalId: "cust-002",
      vehicleExternalId: priya.vehicles[0].externalId,
    },
  ],
  "cust-003": [
    {
      id: "SH005",
      serviceDate: "2024-11-05",
      serviceType: "Maintenance",
      engineerName: "Technician Vikram",
      partsUsed: ["Engine Oil 5L", "Coolant 5L", "Air Filter"],
      laborCharges: "₹1500",
      partsCharges: "₹2000",
      totalAmount: "₹3500",
      invoiceNumber: "INV-2024-050",
      jobCardId: "JC005",
      customerExternalId: "cust-003",
      vehicleExternalId: amit.vehicles[0].externalId,
    },
  ],
};

export const serviceHistoryData: Record<number, ExtendedServiceHistoryItem[]> = {
  1: perCustomerServiceHistory["cust-001"],
  2: perCustomerServiceHistory["cust-002"],
  3: perCustomerServiceHistory["cust-003"],
};

export const serviceHistoryByCustomer = perCustomerServiceHistory;

