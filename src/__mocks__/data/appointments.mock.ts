/**
 * Mock data for Appointments
 */

import { mockCustomers } from "./customers.mock";

export interface Appointment {
  id: number;
  customerName: string;
  vehicle: string;
  phone: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  customerExternalId?: string;
  vehicleExternalId?: string;
  serviceCenterId?: number;
  serviceCenterName?: string;
}

/**
 * Default appointments data
 * In production, this would be fetched from an API
 */
const [rajesh, priya] = mockCustomers;

export const defaultAppointments: Appointment[] = [
  {
    id: 1,
    customerName: rajesh.name,
    vehicle: `Honda City (${rajesh.vehicles[0].registration})`,
    phone: rajesh.phone,
    serviceType: "Routine Maintenance",
    date: "2025-01-20",
    time: "10:00 AM",
    duration: "2 hours",
    status: "Confirmed",
    customerExternalId: rajesh.externalId,
    vehicleExternalId: rajesh.vehicles[0].externalId,
    serviceCenterId: 1,
    serviceCenterName: "Delhi Central Hub",
  },
  {
    id: 2,
    customerName: priya.name,
    vehicle: `Maruti Swift (${priya.vehicles[0].registration})`,
    phone: priya.phone,
    serviceType: "AC Repair",
    date: "2025-01-20",
    time: "2:00 PM",
    duration: "3 hours",
    status: "Confirmed",
    customerExternalId: priya.externalId,
    vehicleExternalId: priya.vehicles[0].externalId,
    serviceCenterId: 2,
    serviceCenterName: "Mumbai Metroplex",
  },
];

/**
 * Available service types for appointments
 */
export const serviceTypes = [
  "Routine Maintenance",
  "AC Repair",
  "Oil Change",
  "Battery Replacement",
  "Tire Service",
  "Brake Service",
  "Other",
] as const;

export type ServiceType = typeof serviceTypes[number];

