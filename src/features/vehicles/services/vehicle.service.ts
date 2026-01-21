/**
 * Vehicle Service - Business logic layer for vehicle operations
 */

import { vehicleRepository } from "@/core/repositories/vehicle.repository";
import type { Vehicle, NewVehicleForm } from "@/shared/types";

class VehicleService {
  async getAll(params?: any): Promise<Vehicle[]> {
    return vehicleRepository.getAll(params);
  }

  async getById(id: string): Promise<Vehicle> {
    return vehicleRepository.getById(id);
  }

  async getByCustomerId(customerId: string): Promise<Vehicle[]> {
    return vehicleRepository.getByCustomerId(customerId);
  }

  async create(data: {
    customerId: string;
    registration: string;
    vin?: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    variant?: string;
    vehicleColor?: string;
    motorNumber?: string;
    chargerSerialNumber?: string;
    purchaseDate?: string;
    warrantyStatus?: string;
    insuranceStartDate?: string;
    insuranceEndDate?: string;
    insuranceCompanyName?: string;
  }): Promise<Vehicle> {
    // Helper to handle optional fields - convert empty strings to undefined
    // Backend validators like @IsDateString and @IsString fail on empty strings even with @IsOptional
    const handleOptionalField = <T>(value: T | undefined | null | string): T | undefined => {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return undefined;
      }
      return value as T;
    };

    // Helper to format date strings - ensure proper ISO format or undefined
    // Backend expects @IsDateString() which validates ISO date format
    const formatDateField = (date: string | undefined | null): string | undefined => {
      if (!date || (typeof date === 'string' && date.trim() === '')) {
        return undefined;
      }
      // If it's already a valid date string, try to convert and validate
      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          // Invalid date
          return undefined;
        }
        return dateObj.toISOString();
      } catch {
        return undefined;
      }
    };

    // Map frontend form data to backend DTO structure
    // Transform empty strings to undefined for optional fields
    const backendPayload = {
      customerId: data.customerId,
      registration: data.registration.trim(),
      vin: handleOptionalField(data.vin),
      vehicleMake: data.vehicleMake.trim(),
      vehicleModel: data.vehicleModel.trim(),
      vehicleYear: data.vehicleYear,
      variant: handleOptionalField(data.variant),
      vehicleColor: handleOptionalField(data.vehicleColor),
      motorNumber: handleOptionalField(data.motorNumber),
      chargerSerialNumber: handleOptionalField(data.chargerSerialNumber),
      purchaseDate: formatDateField(data.purchaseDate),
      warrantyStatus: handleOptionalField(data.warrantyStatus),
      insuranceStartDate: formatDateField(data.insuranceStartDate),
      insuranceEndDate: formatDateField(data.insuranceEndDate),
      insuranceCompanyName: handleOptionalField(data.insuranceCompanyName),
    };

    // Remove undefined fields from payload to avoid sending them
    Object.keys(backendPayload).forEach(key => {
      if (backendPayload[key as keyof typeof backendPayload] === undefined) {
        delete backendPayload[key as keyof typeof backendPayload];
      }
    });

    return vehicleRepository.create(backendPayload as any);
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    // Apply same transformations for update as create
    const handleOptionalField = <T>(value: T | undefined | null | string): T | undefined => {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return undefined;
      }
      return value as T;
    };

    const formatDateField = (date: string | undefined | null): string | undefined => {
      if (!date || (typeof date === 'string' && date.trim() === '')) {
        return undefined;
      }
      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return undefined;
        }
        return dateObj.toISOString();
      } catch {
        return undefined;
      }
    };

    // Transform the update payload
    const updatePayload: any = {};
    
    if (data.registration !== undefined) {
      updatePayload.registration = typeof data.registration === 'string' ? data.registration.trim() : data.registration;
    }
    if (data.vin !== undefined) {
      updatePayload.vin = handleOptionalField(data.vin);
    }
    if (data.vehicleMake !== undefined) {
      updatePayload.vehicleMake = typeof data.vehicleMake === 'string' ? data.vehicleMake.trim() : data.vehicleMake;
    }
    if (data.vehicleModel !== undefined) {
      updatePayload.vehicleModel = typeof data.vehicleModel === 'string' ? data.vehicleModel.trim() : data.vehicleModel;
    }
    if (data.vehicleYear !== undefined) {
      updatePayload.vehicleYear = data.vehicleYear;
    }
    if (data.variant !== undefined) {
      updatePayload.variant = handleOptionalField(data.variant);
    }
    if (data.vehicleColor !== undefined) {
      updatePayload.vehicleColor = handleOptionalField(data.vehicleColor);
    }
    if (data.motorNumber !== undefined) {
      updatePayload.motorNumber = handleOptionalField(data.motorNumber);
    }
    if (data.chargerSerialNumber !== undefined) {
      updatePayload.chargerSerialNumber = handleOptionalField(data.chargerSerialNumber);
    }
    if (data.purchaseDate !== undefined) {
      updatePayload.purchaseDate = formatDateField(data.purchaseDate as string);
    }
    if (data.warrantyStatus !== undefined) {
      updatePayload.warrantyStatus = handleOptionalField(data.warrantyStatus);
    }
    if (data.insuranceStartDate !== undefined) {
      updatePayload.insuranceStartDate = formatDateField(data.insuranceStartDate as string);
    }
    if (data.insuranceEndDate !== undefined) {
      updatePayload.insuranceEndDate = formatDateField(data.insuranceEndDate as string);
    }
    if (data.insuranceCompanyName !== undefined) {
      updatePayload.insuranceCompanyName = handleOptionalField(data.insuranceCompanyName);
    }

    // Remove undefined fields
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    return vehicleRepository.update(id, updatePayload);
  }

  async delete(id: string): Promise<void> {
    return vehicleRepository.delete(id);
  }
}

export const vehicleService = new VehicleService();
