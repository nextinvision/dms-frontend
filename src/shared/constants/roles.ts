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

