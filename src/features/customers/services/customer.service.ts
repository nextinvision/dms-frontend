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

  async getRecent(limit: number = 10, params?: Record<string, any>): Promise<CustomerWithVehicles[]> {
    return customerRepository.getAll({ limit, sort: 'recent', ...params });
  }

  async create(data: NewCustomerForm): Promise<CustomerWithVehicles> {
    // Map frontend form data to backend DTO structure
    // This ensures we only send fields the backend expects and map mismatches
    
    // Helper to format phone number for backend validation
    // Backend expects 10-digit numbers without country code prefix (e.g., 9876543210)
    const formatPhoneForBackend = (phone: string | undefined | null, required: boolean = false): string | undefined => {
      if (!phone || phone.trim() === '') {
        if (required) {
          throw new Error('Phone number is required');
        }
        return undefined;
      }
      // Remove any spaces, dashes, and country code prefix (+91 or 91)
      const cleaned = phone.replace(/[\s-+]/g, "").replace(/^91/, "");
      // Must be 10 digits starting with 6-9 for Indian mobile numbers
      if (/^[6-9]\d{9}$/.test(cleaned)) {
        return cleaned; // Return only the 10-digit number
      }
      // If invalid format and required, throw error
      if (required) {
        throw new Error('Phone number must be a valid 10-digit Indian mobile number');
      }
      // For optional fields, return undefined if invalid
      return undefined;
    };

    // Helper to handle optional fields - convert empty strings to undefined
    // Backend validators like @IsPhoneNumber and @IsEmail fail on empty strings even with @IsOptional
    const handleOptionalField = <T>(value: T | undefined | null | string): T | undefined => {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return undefined;
      }
      return value as T;
    };

    const backendPayload = {
      name: data.name?.trim(),
      phone: formatPhoneForBackend(data.phone, true), // Required field
      whatsappNumber: formatPhoneForBackend(data.whatsappNumber),
      alternateNumber: formatPhoneForBackend(data.alternateNumber),
      email: handleOptionalField(data.email),
      address: handleOptionalField(data.address),
      cityState: handleOptionalField(data.cityState),
      pincode: handleOptionalField(data.pincode),
      customerType: data.customerType || 'B2C'
    };

    // Remove undefined fields from payload to avoid sending them
    Object.keys(backendPayload).forEach(key => {
      if (backendPayload[key as keyof typeof backendPayload] === undefined) {
        delete backendPayload[key as keyof typeof backendPayload];
      }
    });

    return customerRepository.create(backendPayload as any);
  }

  async update(id: number | string, data: Partial<CustomerWithVehicles>): Promise<CustomerWithVehicles> {
    return customerRepository.update(String(id), data);
  }

  async delete(id: number | string): Promise<void> {
    return customerRepository.delete(String(id));
  }
}

export const customerService = new CustomerService();

