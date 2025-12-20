import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobCardRepository } from '../job-card.repository';
import { apiClient } from '@/core/api/client';

// Mock the API client
const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/core/api/client', () => ({
    apiClient: {
        get: (...args: any[]) => getMock(...args),
        post: (...args: any[]) => postMock(...args),
        put: (...args: any[]) => putMock(...args),
        delete: (...args: any[]) => deleteMock(...args),
    },
}));

describe('JobCardRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all job cards', async () => {
        const mockData = [{ id: '1', status: 'Open' }];
        getMock.mockResolvedValue({ data: mockData });

        const result = await jobCardRepository.getAll();

        expect(getMock).toHaveBeenCalledWith('/job-cards', { params: undefined });
        expect(result).toEqual(mockData);
    });

    it('should fetch a single job card by ID', async () => {
        const mockData = { id: '1', status: 'Open' };
        getMock.mockResolvedValue({ data: mockData });

        const result = await jobCardRepository.getById('1');

        expect(getMock).toHaveBeenCalledWith('/job-cards/1');
        expect(result).toEqual(mockData);
    });

    it('should create a job card', async () => {
        const mockData = { id: '1', status: 'Open' };
        const payload = { status: 'Open' };
        postMock.mockResolvedValue({ data: mockData });

        const result = await jobCardRepository.create(payload as any);

        expect(postMock).toHaveBeenCalledWith('/job-cards', payload);
        expect(result).toEqual(mockData);
    });

    it('should update a job card', async () => {
        const mockData = { id: '1', status: 'Closed' };
        const payload = { status: 'Closed' };
        putMock.mockResolvedValue({ data: mockData });

        const result = await jobCardRepository.update('1', payload as any);

        expect(putMock).toHaveBeenCalledWith('/job-cards/1', payload);
        expect(result).toEqual(mockData);
    });

    it('should get by status', async () => {
        const mockData = [{ id: '1', status: 'Open' }];
        getMock.mockResolvedValue({ data: mockData });

        const result = await jobCardRepository.getByStatus('Open');

        expect(getMock).toHaveBeenCalledWith('/job-cards', { params: { status: 'Open' } });
        expect(result).toEqual(mockData);
    });
});
