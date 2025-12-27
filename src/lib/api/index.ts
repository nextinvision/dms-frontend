/**
 * Compatibility layer for API Client
 * Re-exports from new core location
 * 
 * @deprecated Import from @/core/api instead
 */

export { apiClient, mockApiClient } from "@/core/api";
export { apiClient as realApiClient } from "@/core/api";
export { ApiError, getErrorMessage } from "@/core/api";
export type { ApiResponse, ApiRequestConfig } from "@/core/api";
// Export ApiClient type if needed. Core exports it? 
// core/api/client.ts exports class ApiClient. core/api/index sets it up?
// Let's just export what we can. 
export type { ApiEndpoint, HttpMethod } from "@/core/api";
