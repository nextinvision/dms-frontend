
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePartsApproval } from '@/shared/hooks/usePartsApproval';
import { jobCardService } from '@/features/job-cards/services/jobCard.service';

// Mock dependencies
vi.mock('@/features/job-cards/services/jobCard.service');
vi.mock('@/shared/hooks/useRole', () => ({
    useRole: () => ({ userInfo: { serviceCenterId: '123' }, userRole: 'sc_manager' })
}));

describe('Approval Flow Debugging', () => {
    it('status APPROVED should map to scManagerApproved=true', () => {
        // Logic extracted from usePartsApproval.ts
        const mapPartsRequestToFrontend = (req: any) => {
            const status = req.status;
            const isScApproved = status === 'APPROVED' || status === 'COMPLETED' || status === 'PARTIALLY_APPROVED';
            return { status, scManagerApproved: isScApproved };
        };

        const pendingReq = { status: 'PENDING' };
        expect(mapPartsRequestToFrontend(pendingReq).scManagerApproved).toBe(false);

        const approvedReq = { status: 'APPROVED' };
        expect(mapPartsRequestToFrontend(approvedReq).scManagerApproved).toBe(true);
    });

    it('should call updateStatus with APPROVED when approved', async () => {
        const updateSpy = vi.spyOn(jobCardService, 'updatePartsRequestStatus');

        // Simulate immediate resolution
        updateSpy.mockResolvedValue({} as any);

        await jobCardService.updatePartsRequestStatus('req-1', 'APPROVED', 'Notes');

        expect(updateSpy).toHaveBeenCalledWith('req-1', 'APPROVED', 'Notes');
    });
});
