/**
 * Job Card Service - Business logic layer for job card operations
 */

import { apiClient, mockApiClient, ApiError } from "@/core/api";
import { API_ENDPOINTS } from "@/config/api.config";
import { API_CONFIG } from "@/config/api.config";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import type { JobCard } from "@/shared/types/job-card.types";
import type { ApiRequestConfig } from "@/core/api";
import { normalizeJobCard } from "@/shared/utils/normalization.utils";

class JobCardService {
  private useMock: boolean;

  constructor() {
    this.useMock = API_CONFIG.USE_MOCK;
    this.setupMockEndpoints();
  }

  private setupMockEndpoints(): void {
    if (!this.useMock) return;

    mockApiClient.registerMock("/job-cards/:id/from-quotation", "POST", async (config: ApiRequestConfig) => {
      const url = config.url || "";
      const match = url.match(/\/job-cards\/([^/?]+)\/from-quotation/);
      const quotationId = match ? match[1] : "";
      if (!quotationId) {
        throw new ApiError("Quotation ID is required", 400, "VALIDATION_ERROR");
      }
      const body = config.body as { engineerId?: string };
      return {
        id: `jc_${Date.now()}`,
        jobCardNumber: `JC-${Date.now()}`,
        serviceCenterId: "",
        customerId: "",
        customerName: "",
        vehicle: "",
        registration: "",
        serviceType: "",
        description: "",
        status: "CREATED",
        priority: "NORMAL",
        assignedEngineer: body.engineerId || null,
        estimatedCost: "0",
        estimatedTime: "0",
        parts: [],
        location: "STATION",
        quotationId,
        createdAt: new Date().toISOString(),
      };
    });

    mockApiClient.registerMock("/job-cards/:id/assign-engineer", "PATCH", async (config: ApiRequestConfig) => {
      const url = config.url || "";
      const match = url.match(/\/job-cards\/([^/?]+)\/assign-engineer/);
      const jobCardId = match ? match[1] : "";
      if (!jobCardId) {
        throw new ApiError("Job Card ID is required", 400, "VALIDATION_ERROR");
      }
      const body = config.body as { engineerId: string; engineerName: string };
      return {
        id: jobCardId,
        jobCardNumber: `JC-${jobCardId}`,
        serviceCenterId: "",
        customerId: "",
        customerName: "",
        vehicle: "",
        registration: "",
        serviceType: "",
        description: "",
        status: "ASSIGNED",
        priority: "NORMAL",
        assignedEngineer: body.engineerId,
        estimatedCost: "0",
        estimatedTime: "0",
        parts: [],
        location: "STATION",
        createdAt: new Date().toISOString(),
      };
    });
  }

  async getAll(): Promise<JobCard[]> {
    if (this.useMock) {
      return safeStorage.getItem<JobCard[]>("jobCards", []);
    }
    const response = await apiClient.get<JobCard[]>(API_ENDPOINTS.JOB_CARDS);
    return response.data;
  }

  async create(jobCard: Partial<JobCard>): Promise<JobCard> {
    if (this.useMock) {
      const existing = await this.getAll();
      const normalized = normalizeJobCard(jobCard);
      const newJobCard = { ...jobCard, ...normalized } as JobCard;
      const updated = [...existing, newJobCard];
      safeStorage.setItem("jobCards", updated);
      return newJobCard;
    }
    const response = await apiClient.post<JobCard>(API_ENDPOINTS.JOB_CARDS, jobCard);
    return response.data;
  }

  async update(jobCardId: string, jobCard: Partial<JobCard>): Promise<JobCard> {
    if (this.useMock) {
      const existing = await this.getAll();
      const existingJobCard = existing.find(jc => jc.id === jobCardId);
      if (!existingJobCard) {
        throw new Error(`Job card with id ${jobCardId} not found`);
      }
      // Merge the existing job card with the update
      const merged = { ...existingJobCard, ...jobCard };
      const normalized = normalizeJobCard(merged);
      const updated = existing.map(jc => jc.id === jobCardId ? { ...jc, ...normalized } : jc);
      safeStorage.setItem("jobCards", updated);
      return updated.find(jc => jc.id === jobCardId) as JobCard;
    }
    const response = await apiClient.patch<JobCard>(
      `${API_ENDPOINTS.JOB_CARDS}/${jobCardId}`,
      jobCard
    );
    return response.data;
  }

  async createFromQuotation(quotationId: string, engineerId?: string): Promise<JobCard> {
    if (this.useMock) {
      return {
        id: `jc_${Date.now()}`,
        jobCardNumber: `JC-${Date.now()}`,
        serviceCenterId: "",
        customerId: "",
        customerName: "",
        vehicle: "",
        registration: "",
        serviceType: "",
        description: "",
        status: "CREATED",
        priority: "NORMAL",
        assignedEngineer: engineerId || null,
        estimatedCost: "0",
        estimatedTime: "0",
        parts: [],
        location: "STATION",
        quotationId,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiClient.post<JobCard>(`${API_ENDPOINTS.JOB_CARD(quotationId)}/from-quotation`, {
      engineerId,
    });
    return response.data;
  }

  async assignEngineer(jobCardId: string, engineerId: string, engineerName: string): Promise<JobCard> {
    if (this.useMock) {
      return {
        id: jobCardId,
        jobCardNumber: `JC-${jobCardId}`,
        serviceCenterId: "",
        customerId: "",
        customerName: "",
        vehicle: "",
        registration: "",
        serviceType: "",
        description: "",
        status: "ASSIGNED",
        priority: "NORMAL",
        assignedEngineer: engineerId,
        estimatedCost: "0",
        estimatedTime: "0",
        parts: [],
        location: "STATION",
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiClient.post<JobCard>(`${API_ENDPOINTS.JOB_CARD(jobCardId)}/assign-engineer`, {
      engineerId,
    });
    return response.data;
  }

  async passToManager(jobCardId: string, managerId: string): Promise<JobCard> {
    const response = await apiClient.post<JobCard>(
      `${API_ENDPOINTS.JOB_CARD(jobCardId)}/pass-to-manager`,
      { managerId }
    );
    return response.data;
  }

  async managerReview(
    jobCardId: string,
    data: { status: "APPROVED" | "REJECTED"; notes?: string }
  ): Promise<JobCard> {
    const response = await apiClient.post<JobCard>(
      `${API_ENDPOINTS.JOB_CARD(jobCardId)}/manager-review`,
      data
    );
    return response.data;
  }

  async convertToActual(jobCardId: string): Promise<JobCard> {
    const response = await apiClient.post<JobCard>(
      `${API_ENDPOINTS.JOB_CARD(jobCardId)}/convert-to-actual`,
      {}
    );
    return response.data;
  }
}

export const jobCardService = new JobCardService();

