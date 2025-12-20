/**
 * Customer Service - Business logic layer for customer operations
 */

import { customerRepository } from "@/core/repositories/customer.repository";
import type { CustomerWithVehicles, NewCustomerForm, CustomerSearchType } from "@/shared/types";

class CustomerService {
  async getAll(): Promise<CustomerWithVehicles[]> {
    return customerRepository.getAll();
  }

  async getById(id: number | string): Promise<CustomerWithVehicles> {
    return customerRepository.getById(String(id));
  }

  async search(query: string, type: CustomerSearchType = "auto"): Promise<CustomerWithVehicles[]> {
    return customerRepository.search(query, type);
  }

  async getRecent(limit: number = 10): Promise<CustomerWithVehicles[]> {
    // Note: getRecent is not standard CRUD, added it to extended repo or keep as custom logic
    return customerRepository.getAll({ limit, sort: 'recent' }); // Simplified mapping
  }

  async create(data: NewCustomerForm): Promise<CustomerWithVehicles> {
    return customerRepository.create(data);
  }

  async update(id: number | string, data: Partial<CustomerWithVehicles>): Promise<CustomerWithVehicles> {
    return customerRepository.update(String(id), data);
  }

  async delete(id: number | string): Promise<void> {
    return customerRepository.delete(String(id));
  }
}

export const customerService = new CustomerService();

