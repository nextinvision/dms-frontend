/**
 * Centralized API Error Handler
 * Handles all API errors consistently across the application
 */

import { ApiError } from './types';

export class ApiErrorHandler extends Error {
    public code?: string;
    public status?: number;
    public errors?: Record<string, string[]>;

    constructor(error: ApiError) {
        super(error.message);
        this.name = 'ApiError';
        this.code = error.code;
        this.status = error.status;
        this.errors = error.errors;
    }
}

/**
 * Parse error response from API
 */
export function parseApiError(error: any): ApiError {
    // Handle null/undefined or non-object errors
    if (!error || typeof error !== 'object') {
        return {
            message: String(error || 'An unknown error occurred'),
            code: 'UNKNOWN_ERROR',
            status: 0,
        };
    }

    // Handle network errors (no response property)
    if (!error.response) {
        return {
            message: error.message || 'Network error. Please check your connection.',
            code: 'NETWORK_ERROR',
            status: 0,
        };
    }

    const { status, data } = error.response;

    // Handle NestJS validation error format
    // Backend returns: { statusCode: 400, message: "Validation failed", errors: [...] }
    if (data?.errors && Array.isArray(data.errors)) {
        // Join validation errors into a readable message
        const validationMessages = data.errors
            .map((err: string | any) => typeof err === 'string' ? err : err.message || JSON.stringify(err))
            .join('; ');
        
        return {
            message: data.message || 'Validation failed',
            code: data.code || `HTTP_${status}`,
            status,
            errors: data.errors,
            validationMessage: validationMessages,
        };
    }

    // Handle different error formats
    if (data?.message) {
        return {
            message: data.message,
            code: data.code || `HTTP_${status}`,
            status,
            errors: data.errors,
        };
    }

    // Default error messages based on status code
    const defaultMessages: Record<number, string> = {
        400: 'Bad request. Please check your input.',
        401: 'Unauthorized. Please log in again.',
        403: 'Forbidden. You do not have permission to perform this action.',
        404: 'Resource not found.',
        409: 'Conflict. The resource already exists.',
        422: 'Validation error. Please check your input.',
        500: 'Internal server error. Please try again later.',
        502: 'Bad gateway. The server is temporarily unavailable.',
        503: 'Service unavailable. Please try again later.',
    };

    return {
        message: defaultMessages[status] || 'An unexpected error occurred.',
        code: `HTTP_${status}`,
        status,
        errors: data?.errors || data,
    };
}

/**
 * Handle API error and optionally show toast
 */
export function handleApiError(error: any, showToast?: (message: string, type: 'error') => void): ApiError {
    const apiError = parseApiError(error);

    // Show toast notification if function provided
    if (showToast) {
        showToast(apiError.message, 'error');
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        const logData = {
            originalError: error,
            parsedError: apiError,
            message: apiError.message,
            code: apiError.code,
            status: apiError.status,
            errors: apiError.errors
        };
        console.error('API Error Details:', JSON.stringify(logData, null, 2));
    }

    return apiError;
}
