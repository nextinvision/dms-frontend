/**
 * Service for creating parts requests from job cards
 */

import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import type { JobCardPartsRequest } from "@/shared/types/jobcard-inventory.types";
import type { JobCard } from "@/shared/types/job-card.types";
import { partsMasterService } from "./partsMaster.service";

const STORAGE_KEY = "jobCardPartsRequests";

class JobCardPartsRequestService {
  /**
   * Create a parts request from a job card
   * This is called when SC Manager creates a job card with parts
   */
  async createRequestFromJobCard(
    jobCard: JobCard,
    parts: Array<{ partId: string; partName: string; quantity: number }>,
    requestedBy: string
  ): Promise<JobCardPartsRequest> {
    const request: JobCardPartsRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobCardId: jobCard.id || jobCard.jobCardNumber,
      vehicleId: jobCard.vehicleId,
      vehicleNumber: jobCard.registration || undefined,
      customerName: jobCard.customerName,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: "pending",
      parts,
    };

    const existingRequests = safeStorage.getItem<JobCardPartsRequest[]>(STORAGE_KEY, []);
    safeStorage.setItem(STORAGE_KEY, [request, ...existingRequests]);

    return request;
  }

  /**
   * Get all requests
   */
  async getAll(): Promise<JobCardPartsRequest[]> {
    return safeStorage.getItem<JobCardPartsRequest[]>(STORAGE_KEY, []);
  }

  /**
   * Get pending requests
   */
  async getPending(): Promise<JobCardPartsRequest[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === "pending");
  }

  /**
   * Get request by ID
   */
  async getById(id: string): Promise<JobCardPartsRequest | null> {
    const all = await this.getAll();
    return all.find((r) => r.id === id) || null;
  }

  /**
   * Get requests by job card ID
   */
  async getByJobCardId(jobCardId: string): Promise<JobCardPartsRequest[]> {
    const all = await this.getAll();
    return all.filter((r) => r.jobCardId === jobCardId);
  }

  /**
   * Check if parts are available in stock
   */
  async checkPartsAvailability(parts: Array<{ partId: string; quantity: number }>): Promise<{
    available: boolean;
    unavailableParts: Array<{ partId: string; partName: string; available: number; required: number }>;
  }> {
    const unavailableParts: Array<{ partId: string; partName: string; available: number; required: number }> = [];

    for (const part of parts) {
      const partData = await partsMasterService.getById(part.partId);
      if (!partData) {
        unavailableParts.push({
          partId: part.partId,
          partName: "Unknown Part",
          available: 0,
          required: part.quantity,
        });
      } else if (partData.stockQuantity < part.quantity) {
        unavailableParts.push({
          partId: part.partId,
          partName: partData.partName,
          available: partData.stockQuantity,
          required: part.quantity,
        });
      }
    }

    return {
      available: unavailableParts.length === 0,
      unavailableParts,
    };
  }
}

export const jobCardPartsRequestService = new JobCardPartsRequestService();

