/**
 * Search utilities for customer page
 */

import type { CustomerSearchType } from "@/shared/types";

/**
 * Auto-detect search type based on input query
 * @param query - Search query string
 * @returns Detected search type
 */
export function detectSearchType(query: string): CustomerSearchType {
  const trimmed = query.trim();

  // Check for email - matches if contains @
  if (trimmed.includes("@")) {
    return "email";
  }

  // Check for customer number pattern (CUST-YYYY-XXXX)
  if (/^CUST-/i.test(trimmed)) {
    return "customerNumber";
  }

  // Check for standard Vehicle Number patterns first (e.g., MH12, MH-12, MH 12 AB 1234)
  // Matches start with 2 letters followed by numbers, optional separators
  if (/^[A-Z]{2}[ -]?\d{1,2}/i.test(trimmed)) {
    return "vehicleNumber";
  }

  // Check for VIN (17 chars is standard, but we allow 10+ alphanumeric for partial VINs)
  // VINs typically don't have I, O, Q, but we'll use broad alphanumeric
  if (/^[A-Z0-9]{10,17}$/i.test(trimmed) && !/\s/.test(trimmed)) {
    return "vin";
  }

  // Check generally for mixed alphanumeric (letters + numbers) -> likely Vehicle Number or partial VIN
  // This catches cases like "AB1234" which might be part of a plate
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const hasNumbers = /\d/.test(trimmed);
  if (hasLetters && hasNumbers) {
    // If very long and no spaces, lean towards VIN, otherwise Vehicle Number
    return trimmed.length > 10 && !/\s/.test(trimmed) ? "vin" : "vehicleNumber";
  }

  // Check for phone - allow partial numbers (3+ digits)
  // Only if it looks like a phone number (mostly digits)
  const cleanedPhone = trimmed.replace(/[\s-+().]/g, "").replace(/^91/, "");
  if (/^\d{3,}$/.test(cleanedPhone)) {
    return "phone";
  }

  // Default to name search
  return "name";
}

/**
 * Get human-readable label for search type
 * @param type - Search type or null
 * @returns Label string or empty string
 */
export function getSearchTypeLabel(type: CustomerSearchType | null): string {
  if (!type) return "";
  const labels: Record<CustomerSearchType, string> = {
    phone: "Phone Number",
    email: "Email ID",
    customerNumber: "Customer ID",
    vin: "VIN Number",
    vehicleNumber: "Vehicle Number",
    name: "Name",
    auto: "Auto-detect",
  };
  return labels[type];
}

