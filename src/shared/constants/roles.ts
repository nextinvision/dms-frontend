import type { UserRole } from '../types/auth.types';

/**
 * All available user roles
 */
export const USER_ROLES: UserRole[] = [
  "admin",
  "super_admin",
  "sc_manager",
  "sc_staff",
  "service_engineer",
  "service_advisor",
  "call_center",
];

/**
 * Admin roles
 */
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

/**
 * Service Center roles
 */
export const SC_ROLES: UserRole[] = [
  "sc_manager",
  "sc_staff",
  "service_engineer",
  "service_advisor",
  "call_center",
];

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  sc_manager: "SC Manager",
  sc_staff: "SC Staff",
  service_engineer: "Service Engineer",
  service_advisor: "Service Advisor",
  call_center: "Call Center",
};

/**
 * Roles that can create new customers
 * SC Manager is explicitly excluded as they should not create customers
 */
export const ROLES_CAN_CREATE_CUSTOMER: UserRole[] = [
  "admin",
  "super_admin",
  "call_center",
  "service_advisor",
  "sc_staff",
];

/**
 * Check if a role can create customers
 */
export function canCreateCustomer(role: UserRole): boolean {
  return ROLES_CAN_CREATE_CUSTOMER.includes(role);
}

