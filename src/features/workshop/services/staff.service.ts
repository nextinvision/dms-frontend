import { apiClient, mockApiClient } from "@/core/api";
import type { Engineer } from "@/shared/types/workshop.types";
import { engineers } from "@/__mocks__/data/job-cards.mock";

class StaffService {
    constructor() {
        this.setupMocks();
    }

    private setupMocks() {
        mockApiClient.registerMock("/engineers", "GET", async () => {
            // Return array directly or wrapped? apiClient usually returns data.
            // mockApiClient implementations return the Response Body.
            return engineers;
        });
    }

    async getEngineers(): Promise<Engineer[]> {
        return apiClient.get<Engineer[]>("/engineers");
    }
}

export const staffService = new StaffService();
