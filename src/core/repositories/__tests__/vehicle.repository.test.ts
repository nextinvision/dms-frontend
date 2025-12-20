import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleRepository } from '../vehicle.repository';
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

describe('VehicleRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all vehicles', async () => {
        const mockData = [{ id: '1', registrationNumber: 'ABC 123' }];
        getMock.mockResolvedValue({ data: mockData });

        const result = await vehicleRepository.getAll();

        expect(getMock).toHaveBeenCalledWith('/vehicles', { params: undefined });
        expect(result).toEqual(mockData);
    });

    it('should fetch a single vehicle by ID', async () => {
        const mockData = { id: '1', registrationNumber: 'ABC 123' };
        getMock.mockResolvedValue({ data: mockData });

        const result = await vehicleRepository.getById('1');

        expect(getMock).toHaveBeenCalledWith('/vehicles/1');
        expect(result).toEqual(mockData);
    });

    it('should fetch vehicles by customer ID', async () => {
        const mockData = [{ id: '1', registrationNumber: 'ABC 123', customerId: 'cust1' }];
        getMock.mockResolvedValue({ data: mockData });

        const result = await vehicleRepository.getByCustomerId('cust1');

        expect(getMock).toHaveBeenCalledWith('/vehicles', { params: { customerId: 'cust1' } });
        expect(result).toEqual(mockData);
    });

    it('should create a vehicle', async () => {
        const mockData = { id: '1', registrationNumber: 'ABC 123' };
        const payload = { registrationNumber: 'ABC 123' };
        postMock.mockResolvedValue({ data: mockData });

        const result = await vehicleRepository.create(payload as any);

        expect(postMock).toHaveBeenCalledWith('/vehicles', payload);
        expect(result).toEqual(mockData);
    });

    it('should update a vehicle', async () => {
        const mockData = { id: '1', registrationNumber: 'ABC 123 Updated' };
        const payload = { registrationNumber: 'ABC 123 Updated' };
        putMock.mockResolvedValue({ data: mockData });

        const result = await vehicleRepository.update('1', payload as any);

        expect(putMock).toHaveBeenCalledWith('/vehicles/1', payload);
        expect(result).toEqual(mockData);
    });

    it('should delete a vehicle', async () => {
        deleteMock.mockResolvedValue({ data: { success: true } });

        await vehicleRepository.delete('1');

        expect(deleteMock).toHaveBeenCalledWith('/vehicles/1');
    });
});
