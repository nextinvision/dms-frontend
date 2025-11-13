/**
 * Job Card Type Definitions
 */

import type { ServiceLocation, Priority } from './common.types';

export type JobCardStatus = 
  | "Created" 
  | "Assigned" 
  | "In Progress" 
  | "Parts Pending" 
  | "Completed" 
  | "Invoiced";

export interface JobCard {
  id: string;
  customerName: string;
  vehicle: string;
  registration: string;
  serviceType: string;
  description: string;
  status: JobCardStatus;
  priority: Priority;
  assignedEngineer: string | null;
  estimatedCost: string;
  estimatedTime: string;
  startTime?: string;
  createdAt: string;
  completedAt?: string;
  parts: string[];
  location: ServiceLocation;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: JobCardStatus;
}

