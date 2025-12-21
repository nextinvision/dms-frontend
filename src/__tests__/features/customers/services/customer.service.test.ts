import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customerService } from "@/features/customers/services/customer.service";
import { customerRepository } from '@/core/repositories/customer.repository';
import { createMockCustomer } from '@/test/utils/mocks';
import type { CustomerWithVehicles } from '@/shared/types';

// Mock the repository
vi.mock('@/core/repositories/customer.repository', () => ({
  customerRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns all customers from repository', async () => {
      const mockCustomers = [createMockCustomer({ id: '1' }), createMockCustomer({ id: '2' })];
      vi.mocked(customerRepository.getAll).mockResolvedValue(mockCustomers);

      const result = await customerService.getAll();

      expect(customerRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('getById', () => {
    it('returns customer by id', async () => {
      const mockCustomer = createMockCustomer({ id: '1' });
      vi.mocked(customerRepository.getById).mockResolvedValue(mockCustomer);

      const result = await customerService.getById('1');

      expect(customerRepository.getById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCustomer);
    });

    it('converts number id to string', async () => {
      const mockCustomer = createMockCustomer({ id: '123' });
      vi.mocked(customerRepository.getById).mockResolvedValue(mockCustomer);

      await customerService.getById(123);

      expect(customerRepository.getById).toHaveBeenCalledWith('123');
    });
  });

  describe('search', () => {
    it('searches customers with query', async () => {
      const mockCustomers = [createMockCustomer({ id: '1', name: 'John Doe' })];
      vi.mocked(customerRepository.search).mockResolvedValue(mockCustomers);

      const result = await customerService.search('John');

      expect(customerRepository.search).toHaveBeenCalledWith('John', 'auto');
      expect(result).toEqual(mockCustomers);
    });

    it('uses custom search type', async () => {
      const mockCustomers = [createMockCustomer({ id: '1' })];
      vi.mocked(customerRepository.search).mockResolvedValue(mockCustomers);

      await customerService.search('John', 'phone');

      expect(customerRepository.search).toHaveBeenCalledWith('John', 'phone');
    });
  });

  describe('getRecent', () => {
    it('returns recent customers with limit', async () => {
      const mockCustomers = [createMockCustomer({ id: '1' })];
      vi.mocked(customerRepository.getAll).mockResolvedValue(mockCustomers);

      const result = await customerService.getRecent(5);

      expect(customerRepository.getAll).toHaveBeenCalledWith({ limit: 5, sort: 'recent' });
      expect(result).toEqual(mockCustomers);
    });

    it('uses default limit of 10', async () => {
      const mockCustomers = [createMockCustomer({ id: '1' })];
      vi.mocked(customerRepository.getAll).mockResolvedValue(mockCustomers);

      await customerService.getRecent();

      expect(customerRepository.getAll).toHaveBeenCalledWith({ limit: 10, sort: 'recent' });
    });
  });

  describe('create', () => {
    it('creates new customer', async () => {
      const newCustomerData = {
        name: 'New Customer',
        phone: '+1234567890',
        email: 'new@example.com',
      };
      const mockCustomer = createMockCustomer({ ...newCustomerData, id: '1' });
      vi.mocked(customerRepository.create).mockResolvedValue(mockCustomer);

      const result = await customerService.create(newCustomerData);

      expect(customerRepository.create).toHaveBeenCalledWith(newCustomerData);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('update', () => {
    it('updates existing customer', async () => {
      const updateData = { name: 'Updated Name' };
      const mockCustomer = createMockCustomer({ id: '1', name: 'Updated Name' });
      vi.mocked(customerRepository.update).mockResolvedValue(mockCustomer);

      const result = await customerService.update('1', updateData);

      expect(customerRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockCustomer);
    });

    it('converts number id to string', async () => {
      const updateData = { name: 'Updated Name' };
      const mockCustomer = createMockCustomer({ id: '123', name: 'Updated Name' });
      vi.mocked(customerRepository.update).mockResolvedValue(mockCustomer);

      await customerService.update(123, updateData);

      expect(customerRepository.update).toHaveBeenCalledWith('123', updateData);
    });
  });

  describe('delete', () => {
    it('deletes customer by id', async () => {
      vi.mocked(customerRepository.delete).mockResolvedValue(undefined);

      await customerService.delete('1');

      expect(customerRepository.delete).toHaveBeenCalledWith('1');
    });

    it('converts number id to string', async () => {
      vi.mocked(customerRepository.delete).mockResolvedValue(undefined);

      await customerService.delete(123);

      expect(customerRepository.delete).toHaveBeenCalledWith('123');
    });
  });
});

