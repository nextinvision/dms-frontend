import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerRepository } from "@/core/repositories/customer.repository";
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

describe('CustomerRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all customers', async () => {
        const mockData = [{ id: '1', name: 'John Doe' }];
        getMock.mockResolvedValue({ data: mockData });

        const result = await customerRepository.getAll();

        expect(getMock).toHaveBeenCalledWith('/customers', { params: undefined });
        expect(result).toEqual(mockData);
    });

    it('should fetch a single customer by ID', async () => {
        const mockData = { id: '1', name: 'John Doe' };
        getMock.mockResolvedValue({ data: mockData });

        const result = await customerRepository.getById('1');

        expect(getMock).toHaveBeenCalledWith('/customers/1');
        expect(result).toEqual(mockData);
    });

    it('should search customers', async () => {
        const mockData = [{ id: '1', name: 'John Doe' }];
        const query = 'John';
        const type = 'name';
        getMock.mockResolvedValue({ data: mockData });

        const result = await customerRepository.search(query, type);

        expect(getMock).toHaveBeenCalledWith('/customers', { params: { search: query, type } });
        expect(result).toEqual(mockData);
    });

    it('should create a customer', async () => {
        const mockData = { id: '1', name: 'John Doe' };
        const payload = { name: 'John Doe' };
        postMock.mockResolvedValue({ data: mockData });

        const result = await customerRepository.create(payload as any);

        expect(postMock).toHaveBeenCalledWith('/customers', payload);
        expect(result).toEqual(mockData);
    });

    it('should update a customer', async () => {
        const mockData = { id: '1', name: 'John Doe Updated' };
        const payload = { name: 'John Doe Updated' };
        putMock.mockResolvedValue({ data: mockData });

        const result = await customerRepository.update('1', payload as any);

        expect(putMock).toHaveBeenCalledWith('/customers/1', payload);
        expect(result).toEqual(mockData);
    });

    it('should delete a customer', async () => {
        deleteMock.mockResolvedValue({ data: { success: true } });

        await customerRepository.delete('1');

        expect(deleteMock).toHaveBeenCalledWith('/customers/1');
    });
});
