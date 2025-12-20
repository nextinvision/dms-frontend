import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApprovalService } from '@/features/inventory/services/adminApproval.service';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { PartsIssue, PartsIssueFormData } from '@/shared/types/central-inventory.types';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getAllStock: vi.fn(),
    getAllServiceCenters: vi.fn(),
    createPartsIssue: vi.fn(),
    getAllPartsIssues: vi.fn(),
  },
}));

describe('AdminApprovalService', () => {
  const mockFormData: PartsIssueFormData = {
    serviceCenterId: 'sc-001',
    items: [
      {
        partId: 'part-1',
        quantity: 10,
        fromStock: 'stock-1',
      },
    ],
    notes: 'Test request',
  };

  const mockStock = {
    id: 'stock-1',
    partName: 'Brake Pad',
    partNumber: 'BP-001',
    hsnCode: '8708',
    unitPrice: 1000,
  };

  const mockServiceCenter = {
    id: 'sc-001',
    name: 'Service Center 1',
  };

  const mockIssue: PartsIssue = {
    id: 'issue-1',
    issueNumber: 'PI-2024-001',
    serviceCenterId: 'sc-001',
    serviceCenterName: 'Service Center 1',
    status: 'pending_admin_approval',
    items: [],
    totalAmount: 10000,
    issuedBy: 'Manager',
    issuedAt: new Date().toISOString(),
    sentToAdmin: true,
    sentToAdminAt: new Date().toISOString(),
  } as PartsIssue;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
    vi.mocked(centralInventoryRepository.getAllStock).mockResolvedValue([mockStock] as any);
    vi.mocked(centralInventoryRepository.getAllServiceCenters).mockResolvedValue([mockServiceCenter] as any);
  });

  describe('createPartsIssueRequest', () => {
    it('creates parts issue request', async () => {
      const issue = await adminApprovalService.createPartsIssueRequest(mockFormData, 'Manager');

      expect(issue).toMatchObject({
        serviceCenterId: 'sc-001',
        status: 'pending_admin_approval',
        sentToAdmin: true,
      });
      expect(issue.issueNumber).toMatch(/^PI-\d{4}-\d{3}$/);
      expect(issue.items).toHaveLength(1);
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('calculates total amount correctly', async () => {
      const issue = await adminApprovalService.createPartsIssueRequest(mockFormData, 'Manager');

      expect(issue.totalAmount).toBe(10000); // 10 * 1000
    });

    it('throws error if service center not found', async () => {
      vi.mocked(centralInventoryRepository.getAllServiceCenters).mockResolvedValue([]);

      await expect(
        adminApprovalService.createPartsIssueRequest(mockFormData, 'Manager')
      ).rejects.toThrow('Service center not found');
    });
  });

  describe('getPendingApprovals', () => {
    it('returns pending approval requests', async () => {
      const pendingIssue = { ...mockIssue, status: 'pending_admin_approval' };
      vi.mocked(safeStorage.getItem).mockReturnValue([pendingIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      const pending = await adminApprovalService.getPendingApprovals();

      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('pending_admin_approval');
    });

    it('filters out non-pending requests', async () => {
      const issues = [
        { ...mockIssue, status: 'pending_admin_approval' },
        { ...mockIssue, id: 'issue-2', status: 'admin_approved' },
        { ...mockIssue, id: 'issue-3', status: 'issued' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(issues as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      const pending = await adminApprovalService.getPendingApprovals();

      expect(pending).toHaveLength(1);
    });
  });

  describe('approvePartsIssue', () => {
    it('approves parts issue request', async () => {
      const pendingIssue = { ...mockIssue, status: 'pending_admin_approval' };
      vi.mocked(safeStorage.getItem).mockReturnValue([pendingIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      const approved = await adminApprovalService.approvePartsIssue('issue-1', 'Admin', 'Approved');

      expect(approved.status).toBe('admin_approved');
      expect(approved.adminApproved).toBe(true);
      expect(approved.adminApprovedBy).toBe('Admin');
      expect(approved.adminApprovedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('throws error if issue not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      await expect(
        adminApprovalService.approvePartsIssue('nonexistent', 'Admin')
      ).rejects.toThrow('Issue request not found');
    });

    it('throws error if issue is not pending', async () => {
      const approvedIssue = { ...mockIssue, status: 'admin_approved' };
      vi.mocked(safeStorage.getItem).mockReturnValue([approvedIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      await expect(
        adminApprovalService.approvePartsIssue('issue-1', 'Admin')
      ).rejects.toThrow('Issue is not pending admin approval');
    });
  });

  describe('rejectPartsIssue', () => {
    it('rejects parts issue request', async () => {
      const pendingIssue = { ...mockIssue, status: 'pending_admin_approval' };
      vi.mocked(safeStorage.getItem).mockReturnValue([pendingIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      const rejected = await adminApprovalService.rejectPartsIssue(
        'issue-1',
        'Admin',
        'Not approved'
      );

      expect(rejected.status).toBe('admin_rejected');
      expect(rejected.adminRejected).toBe(true);
      expect(rejected.adminRejectedBy).toBe('Admin');
      expect(rejected.adminRejectionReason).toBe('Not approved');
      expect(safeStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('issueApprovedParts', () => {
    it('issues parts for approved request', async () => {
      const approvedIssue = {
        ...mockIssue,
        status: 'admin_approved',
        adminApproved: true,
        items: [
          {
            partId: 'part-1',
            partName: 'Brake Pad',
            quantity: 10,
            fromStock: 'stock-1',
          },
        ],
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([approvedIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);
      vi.mocked(centralInventoryRepository.createPartsIssue).mockResolvedValue({
        issue: { ...mockIssue, issueNumber: 'ISSUE-001' },
        stockUpdates: [],
      });

      const issued = await adminApprovalService.issueApprovedParts('issue-1', 'Manager');

      expect(issued.status).toBe('issued');
      expect(issued.issueNumber).toBe('ISSUE-001');
      expect(centralInventoryRepository.createPartsIssue).toHaveBeenCalled();
    });

    it('throws error if parts already issued', async () => {
      const issuedIssue = { ...mockIssue, status: 'issued' };
      vi.mocked(safeStorage.getItem).mockReturnValue([issuedIssue] as any);
      vi.mocked(centralInventoryRepository.getAllPartsIssues).mockResolvedValue([]);

      await expect(
        adminApprovalService.issueApprovedParts('issue-1', 'Manager')
      ).rejects.toThrow('Parts have already been issued');
    });
  });
});

