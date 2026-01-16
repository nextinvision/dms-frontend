/**
 * API Validation Utilities
 * Common validation and transformation functions for API requests
 */

/**
 * Convert date from DD-MM-YYYY to ISO format (YYYY-MM-DD)
 */
export function convertToISODate(dateString: string | undefined | null): string | undefined {
  if (!dateString) return undefined;
  
  // If already ISO format, return as-is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateString;
  }
  
  // Try DD-MM-YYYY format
  const parts = dateString.split('-');
  if (parts.length === 3 && parts[0].length === 2) {
    // DD-MM-YYYY format
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Try DD/MM/YYYY format
  const slashParts = dateString.split('/');
  if (slashParts.length === 3 && slashParts[0].length === 2) {
    return `${slashParts[2]}-${slashParts[1]}-${slashParts[0]}`;
  }
  
  // Return as-is if format not recognized (let backend validate)
  return dateString;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate required fields for appointment creation
 */
export function validateAppointmentData(data: {
  customerId?: string | null;
  vehicleId?: string | null;
  serviceCenterId?: string | null;
  serviceType?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerId || !isValidUUID(data.customerId)) {
    errors.push("Customer ID is required and must be a valid UUID");
  }

  if (!data.vehicleId || !isValidUUID(data.vehicleId)) {
    errors.push("Vehicle ID is required and must be a valid UUID");
  }

  if (!data.serviceCenterId || !isValidUUID(data.serviceCenterId)) {
    errors.push("Service Center ID is required and must be a valid UUID");
  }

  if (!data.serviceType || data.serviceType.trim() === "") {
    errors.push("Service Type is required");
  }

  if (!data.appointmentDate || data.appointmentDate.trim() === "") {
    errors.push("Appointment Date is required");
  }

  if (!data.appointmentTime || data.appointmentTime.trim() === "") {
    errors.push("Appointment Time is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required fields for invoice creation
 */
export function validateInvoiceData(data: {
  serviceCenterId?: string | null;
  customerId?: string | null;
  vehicleId?: string | null;
  items?: any[] | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.serviceCenterId || !isValidUUID(data.serviceCenterId)) {
    errors.push("Service Center ID is required and must be a valid UUID");
  }

  if (!data.customerId || !isValidUUID(data.customerId)) {
    errors.push("Customer ID is required and must be a valid UUID");
  }

  if (!data.vehicleId || !isValidUUID(data.vehicleId)) {
    errors.push("Vehicle ID is required and must be a valid UUID");
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one invoice item is required");
  } else {
    data.items.forEach((item, index) => {
      if (!item.name || item.name.trim() === "") {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Valid unit price (greater than 0) is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity (greater than 0) is required`);
      }
      if (typeof item.gstRate !== 'number' || item.gstRate < 0) {
        errors.push(`Item ${index + 1}: Valid GST rate (0 or greater) is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required fields for quotation creation
 */
export function validateQuotationData(data: {
  serviceCenterId?: string | null;
  customerId?: string | null;
  vehicleId?: string | null;
  items?: any[] | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.serviceCenterId || !isValidUUID(data.serviceCenterId)) {
    errors.push("Service Center ID is required and must be a valid UUID");
  }

  if (!data.customerId || !isValidUUID(data.customerId)) {
    errors.push("Customer ID is required and must be a valid UUID");
  }

  if (!data.vehicleId || !isValidUUID(data.vehicleId)) {
    errors.push("Vehicle ID is required and must be a valid UUID");
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one quotation item is required");
  } else {
    data.items.forEach((item, index) => {
      if (!item.partName || item.partName.trim() === "") {
        errors.push(`Item ${index + 1}: Part name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity (greater than 0) is required`);
      }
      if (typeof item.rate !== 'number' || item.rate < 0) {
        errors.push(`Item ${index + 1}: Valid rate (0 or greater) is required`);
      }
      if (typeof item.gstPercent !== 'number' || item.gstPercent < 0) {
        errors.push(`Item ${index + 1}: Valid GST percentage (0 or greater) is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format error message from API response
 */
export function formatApiErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred";
  
  // Handle error object from ApiErrorHandler (already parsed)
  if (error.message && error.status && error.name === 'ApiError') {
    return error.message;
  }
  
  // Handle error.response.data.message (direct backend response)
  if (error.response?.data?.message) {
    // Check if message is an array (NestJS validation errors)
    if (Array.isArray(error.response.data.message)) {
      return error.response.data.message.join('; ');
    }
    // Return single message string
    return error.response.data.message;
  }
  
  // Handle validation errors array
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const validationErrors = error.response.data.errors
      .map((err: string | any) => typeof err === 'string' ? err : err.message || JSON.stringify(err))
      .join('; ');
    return error.response.data.message 
      ? `${error.response.data.message}: ${validationErrors}`
      : `Validation failed: ${validationErrors}`;
  }
  
  // Handle network errors
  if (error.message && !error.response) {
    return `Network error: ${error.message}`;
  }
  
  // Default message based on status
  const status = error.response?.status || error.status;
  if (status === 400) return "Bad request. Please check your input.";
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Forbidden. You do not have permission.";
  if (status === 404) return "Resource not found.";
  if (status === 409) return "Conflict. The resource already exists.";
  if (status === 422) return "Validation error. Please check your input.";
  if (status === 500) return "Internal server error. Please try again later.";
  
  return error.message || "An unexpected error occurred";
}
