import { describe, it, expect, vi, beforeEach } from 'vitest';
import { centralIssueService } from '@/features/inventory/services/centralIssue.service';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { API_CONFIG } from '@/config/api.config';
import type { PartsIssue, PartsIssueFormData } from '@/shared/types/central-inventory.types';

// Mock dependencies
vi.mock('@/config/api.config', () => ({
  API_CONFIG: {
    USE_MOCK: true,
  },
}));

vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    createPartsIssue: vi.fn(),
    getAllPartsIssues: vi.fn(),
    getPartsIssueById: vi.fn(),
    getPartsIssuesByServiceCenter: vi.fn(),
  },
}));

vi.mock('@/core/api', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('CentralIssueService', () => {
  const mockFormData: PartsIssueFormData = {
    serviceCenterId: 'sc-001',
    serviceCenterName: 'Service Center 1',
    items: [
      {
        partId: 'part-1',
        partName: 'Brake Pad',
        partNumber: 'BP-001',
        quantity: 10,
        unitPrice: 1000,
      },
    ],
    notes: 'Test issue',
  };

  const mockIssue: PartsIssue = {
    id: 'issue-1',
    issueNumber: 'ISSUE-001',
    serviceCenterId: 'sc-001',
    serviceCenterName: 'Service Center 1',
    items: mockFormData.items,
    totalAmount: 10000,
    status: 'issued',
    issuedBy: 'Inventory Manager',
    issuedAt: new Date().toISOString(),
  } as PartsIssue;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('issuePartsToServiceCenter', () => {
    it('issues parts to service center', async () => {
      const result = {
        issue: mockIssue,
        stockUpdates: [],
      };
      vi.mocked(centralInventoryRepository.createPartsIssue).mockResolvedValue(result);

      const response = await centralIssueService.issuePartsToServiceCenter(
        mockFormData,
        'Inventory Manager'
      );

      expect(response.issue).toEqual(mockIssue);
      expect(centralInventoryRepository.createPartsIssue).toHaveBeenCalledWith(
        mockFormData,
        'Inventory Manager'
      );
    });
  });

  describe('getIssueHistory', () => {
    it('returns all parts issues', async () => {
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([mockIssue]);

      const issues = await centralIssueService.getIssueHistory();

      expect(issues).toEqual([mockIssue]);
      expect(centralInventoryRepository.getAllPartsIssues).toHaveBeenCalled();
    });
  });

  describe('getIssueById', () => {
    it('returns issue by id', async () => {
      vi.mocked(centralInventoryRepository.getPartsIssueById).mockResolvedValue(mockIssue);

      const issue = await centralIssueService.getIssueById('issue-1');

      expect(issue).toEqual(mockIssue);
      expect(centralInventoryRepository.getPartsIssueById).toHaveBeenCalledWith('issue-1');
    });

    it('throws error if issue not found', async () => {
      vi.mocked(centralInventoryRepository.getPartsIssueById).mockResolvedValue(null);

      await expect(centralIssueService.getIssueById('nonexistent')).rejects.toThrow(
        'Issue not found'
      );
    });
  });

  describe('getIssuesByServiceCenter', () => {
    it('returns issues for specific service center', async () => {
      const scIssues = [mockIssue];
      vi.mocked(centralInventoryRepository.getPartsIssuesByServiceCenter).mockResolvedValue(scIssues);

      const issues = await centralIssueService.getIssuesByServiceCenter('sc-001');

      expect(issues).toEqual(scIssues);
      expect(centralInventoryRepository.getPartsIssuesByServiceCenter).toHaveBeenCalledWith('sc-001');
    });
  });
});

