import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobCardView } from "@/features/job-cards/hooks/useJobCardView";
import { useJobCards } from "@/features/job-cards/hooks/useJobCards";
import { useRole } from '@/shared/hooks';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
const mockGetServiceCenterContext = vi.fn(() => ({
    serviceCenterId: 'SC001',
    serviceCenterName: 'Test Service Center',
    userRole: 'service_advisor',
}));

const mockFilterByServiceCenter = vi.fn((items: any[]) => items);

vi.mock('@/features/job-cards/hooks/useJobCards', () => ({
    useJobCards: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
    useRole: vi.fn(),
}));

vi.mock('@/shared/lib/serviceCenter', () => ({
    getServiceCenterContext: mockGetServiceCenterContext,
    filterByServiceCenter: mockFilterByServiceCenter,
    shouldFilterByServiceCenter: vi.fn(() => true),
}));

vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(() => ({ get: vi.fn() })),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe('useJobCardView', () => {
    const mockJobCards = [
        { id: '1', status: 'Created', serviceCenterId: 'SC001', jobCardNumber: 'JC001' },
        { id: '2', status: 'Assigned', serviceCenterId: 'SC001', jobCardNumber: 'JC002' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        vi.mocked(useRole).mockReturnValue({
            userRole: 'service_advisor',
            userInfo: { name: 'Advisor Base', id: 'user1' },
            isLoading: false,
        } as any);

        vi.mocked(useJobCards).mockReturnValue({
            data: mockJobCards,
            isLoading: false,
        } as any);

        mockGetServiceCenterContext.mockReturnValue({
            serviceCenterId: 'SC001',
            serviceCenterName: 'Test Service Center',
            userRole: 'service_advisor',
        });

        mockFilterByServiceCenter.mockImplementation((items: any[]) => items);
    });

    it('should return initial state correctly', async () => {
        const { result } = renderHook(() => useJobCardView());

        // Wait for the useEffect to populate jobCards from useJobCards data
        await waitFor(() => {
            expect(result.current.jobCards).toEqual(mockJobCards);
        });

        expect(result.current.view).toBe('list');
        expect(result.current.filter).toBe('all');
        expect(result.current.visibleJobCards).toHaveLength(2);
    });

    it('should filter job cards by status', async () => {
        const { result } = renderHook(() => useJobCardView());

        await waitFor(() => {
            expect(result.current.jobCards).toEqual(mockJobCards);
        });

        act(() => {
            result.current.setFilter('created');
        });

        expect(result.current.filteredJobs).toHaveLength(1);
        expect(result.current.filteredJobs[0].id).toBe('1');
    });

    it('should search job cards by number', async () => {
        const { result } = renderHook(() => useJobCardView());

        await waitFor(() => {
            expect(result.current.jobCards).toEqual(mockJobCards);
        });

        act(() => {
            result.current.setSearchQuery('JC002');
        });

        expect(result.current.filteredJobs).toHaveLength(1);
        expect(result.current.filteredJobs[0].id).toBe('2');
    });
});
