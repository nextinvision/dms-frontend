import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useVehiclesQuery,
  useCustomerVehicles,
  useVehicleDetails,
  useCreateVehicle,
  useUpdateVehicle,
} from '@/features/vehicles/hooks/useVehicles';
import { vehicleRepository } from '@/core/repositories/vehicle.repository';
import { createMockVehicle } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/core/repositories/vehicle.repository', () => ({
  vehicleRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByCustomerId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useVehicles hooks', () => {
  const mockVehicle = createMockVehicle({
    id: '1',
    vehicleMake: 'Tesla',
    vehicleModel: 'Model 3',
    registration: 'ABC123',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useVehiclesQuery', () => {
    it('fetches vehicles with default params', async () => {
      vi.mocked(vehicleRepository.getAll).mockResolvedValue([mockVehicle]);

      const { result } = renderHook(() => useVehiclesQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockVehicle]);
      expect(vehicleRepository.getAll).toHaveBeenCalledWith({});
    });

    it('fetches vehicles with filters', async () => {
      vi.mocked(vehicleRepository.getAll).mockResolvedValue([mockVehicle]);

      const { result } = renderHook(() => useVehiclesQuery({ make: 'Tesla' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(vehicleRepository.getAll).toHaveBeenCalledWith({ make: 'Tesla' });
    });
  });

  describe('useCustomerVehicles', () => {
    it('fetches vehicles for specific customer', async () => {
      vi.mocked(vehicleRepository.getByCustomerId).mockResolvedValue([mockVehicle]);

      const { result } = renderHook(() => useCustomerVehicles('cust-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockVehicle]);
      expect(vehicleRepository.getByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('does not fetch when customerId is empty', () => {
      const { result } = renderHook(() => useCustomerVehicles(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(vehicleRepository.getByCustomerId).not.toHaveBeenCalled();
    });
  });

  describe('useVehicleDetails', () => {
    it('fetches vehicle details by id', async () => {
      vi.mocked(vehicleRepository.getById).mockResolvedValue(mockVehicle);

      const { result } = renderHook(() => useVehicleDetails('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockVehicle);
      expect(vehicleRepository.getById).toHaveBeenCalledWith('1');
    });
  });

  describe('useCreateVehicle', () => {
    it('creates a new vehicle', async () => {
      const newVehicle = { ...mockVehicle, id: '2' };
      vi.mocked(vehicleRepository.create).mockResolvedValue(newVehicle);

      const { result } = renderHook(() => useCreateVehicle(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        vehicleMake: 'Tesla',
        vehicleModel: 'Model Y',
        registration: 'XYZ789',
      } as any);

      expect(vehicleRepository.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateVehicle', () => {
    it('updates an existing vehicle', async () => {
      const updatedVehicle = { ...mockVehicle, vehicleModel: 'Model S' };
      vi.mocked(vehicleRepository.update).mockResolvedValue(updatedVehicle);

      const { result } = renderHook(() => useUpdateVehicle(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: '1',
        data: { vehicleModel: 'Model S' },
      });

      expect(vehicleRepository.update).toHaveBeenCalledWith('1', { vehicleModel: 'Model S' });
    });
  });
});

