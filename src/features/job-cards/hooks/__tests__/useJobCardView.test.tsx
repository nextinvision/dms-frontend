import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobCardView } from '../useJobCardView';
import { useJobCards } from '../useJobCards';
import { useRole } from '@/shared/hooks';
import { getServiceCenterContext } from '@/shared/lib/serviceCenter';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../useJobCards');
vi.mock('@/shared/hooks'); // Mock shared hooks
vi.mock('@/shared/lib/serviceCenter', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib/serviceCenter')>();
    return {
        ...actual,
        getServiceCenterContext: vi.fn(),
    };
});
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
        (useRole as any).mockReturnValue({
            userRole: 'service_advisor',
            userInfo: { name: 'Advisor Base', id: 'user1' },
            isLoading: false,
        });

        // Mock getServiceCenterContext specifically if needed via module mock or if getServiceCenterContext is just a specific function
        // The previous mock was generic for entire module
        // We can assume mocked implementation from above vi.mock works if we set it up?
        // Using vi.mocked helper or casting.

        (getServiceCenterContext as any).mockReturnValue({
            serviceCenterId: 'SC001',
        });

        (useJobCards as any).mockReturnValue({
            data: mockJobCards,
            isLoading: false,
        });
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
