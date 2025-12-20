import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffService } from "@/features/workshop/services/staff.service";
import { apiClient } from '@/core/api';
import type { Engineer } from '@/shared/types/workshop.types';

// Mock apiClient
vi.mock('@/core/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
  mockApiClient: {
    registerMock: vi.fn(),
  },
}));

describe('StaffService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEngineers', () => {
    it('fetches engineers successfully', async () => {
      const mockEngineers: Engineer[] = [
        { id: '1', name: 'Engineer 1', email: 'eng1@example.com', phone: '+1234567890' },
        { id: '2', name: 'Engineer 2', email: 'eng2@example.com', phone: '+1234567891' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEngineers,
      } as any);

      const result = await staffService.getEngineers();

      expect(result).toEqual(mockEngineers);
      expect(apiClient.get).toHaveBeenCalledWith('/engineers');
    });

    it('handles empty engineer list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [],
      } as any);

      const result = await staffService.getEngineers();

      expect(result).toEqual([]);
    });

    it('handles API errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      await expect(staffService.getEngineers()).rejects.toThrow('API Error');
    });

    it('extracts data from API response', async () => {
      const mockEngineers: Engineer[] = [
        { id: '1', name: 'Engineer 1', email: 'eng1@example.com', phone: '+1234567890' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEngineers,
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await staffService.getEngineers();

      expect(result).toBe(mockEngineers);
      expect(result).not.toHaveProperty('status');
    });
  });
});

