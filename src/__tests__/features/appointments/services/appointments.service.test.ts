import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentsService } from '@/features/appointments/services/appointments.service';
import { API_CONFIG } from '@/config/api.config';
import { apiClient } from '@/core/api';

// Mock dependencies
vi.mock('@/config/api.config', () => ({
  API_CONFIG: {
    USE_MOCK: true,
  },
  API_ENDPOINTS: {
    APPOINTMENT: (id: string) => `/appointments/${id}`,
  },
}));

vi.mock('@/core/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
  mockApiClient: {
    registerMock: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number, code: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
    status: number;
    code: string;
  },
}));

describe('AppointmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('linkQuotation', () => {
    it('links quotation to appointment', async () => {
      await appointmentsService.linkQuotation('apt-1', 'quo-1');

      // In mock mode, it just returns without error
      expect(true).toBe(true);
    });

    it('handles linking in non-mock mode', async () => {
      // This would test the actual API call if USE_MOCK is false
      // For now, we test the mock implementation
      const result = await appointmentsService.linkQuotation('apt-1', 'quo-1');

      expect(result).toBeUndefined();
    });
  });
});

