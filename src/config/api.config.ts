// Use /dev-api for development environment, /api for production
const getBaseUrl = () => {
  // Check if we're in development mode (served from /dev/)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dev')) {
    return '/dev-api';
  }
  // Check environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Default to /api for production
  return '/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",

  USERS: "/users",
  USER: (id: string) => `/users/${id}`,

  SERVICE_CENTERS: "/service-centers",
  SERVICE_CENTER: (id: string) => `/service-centers/${id}`,

  APPOINTMENTS: "/appointments",
  APPOINTMENT: (id: string) => `/appointments/${id}`,

  JOB_CARDS: "/job-cards",
  JOB_CARD: (id: string) => `/job-cards/${id}`,

  QUOTATIONS: "/quotations",
  QUOTATION: (id: string) => `/quotations/${id}`,

  INVOICES: "/invoices",
  INVOICE: (id: string) => `/invoices/${id}`,

  LEADS: "/leads",
  LEAD: (id: string) => `/leads/${id}`,

  INVENTORY: "/inventory",
  INVENTORY_PARTS: "/inventory/parts",
  INVENTORY_PART: (id: string) => `/inventory/parts/${id}`,

  PARTS_REQUESTS: "/parts-requests",
  PARTS_REQUEST: (id: string) => `/parts-requests/${id}`,

  PARTS_ISSUES: "/parts-issues",
  PARTS_ISSUE: (id: string) => `/parts-issues/${id}`,

  FILES: "/files",
  FILES_UPLOAD: "/files/upload",

  SERVICE_REQUESTS: "/service-requests",
  SERVICE_REQUEST: (id: string) => `/service-requests/${id}`,
};

export function getApiUrl(path: string): string {
  return `${API_CONFIG.BASE_URL}${path}`;
}
