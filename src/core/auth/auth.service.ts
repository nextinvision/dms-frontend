/**
 * Authentication Service
 * Handles login, logout, and token management
 */

import { apiClient } from '../api/client';
import { useAuthStore } from '@/store/authStore';
import Cookies from 'js-cookie';
import type { UserInfo } from '@/shared/types/auth.types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: UserInfo;
}

class AuthService {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Service] Attempting login with:', credentials.email);
            }

            const response = await apiClient.post<any>('/auth/login', credentials);

            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Service] Raw API response:', response);
                console.log('[Auth Service] Response data:', response.data);
            }

            // Check if response has the expected structure
            // API client unwraps the response, so response.data should contain { access_token, user }
            if (!response || !response.data) {
                console.error('[Auth Service] No data in response:', response);
                throw new Error('Invalid response structure: missing data field');
            }

            // Handle wrapped response from backend (backend returns { data: { access_token, user } })
            const responseData = response.data.data || response.data;
            
            if (!responseData.access_token) {
                console.error('[Auth Service] No access_token in response:', { response, responseData });
                throw new Error('Invalid response: missing access_token');
            }

            if (!responseData.user) {
                console.error('[Auth Service] No user in response:', { response, responseData });
                throw new Error('Invalid response: missing user data');
            }

            // Map Backend User Extended Details to Frontend UserInfo
            const backendUser = responseData.user;
            const user: UserInfo = {
                id: backendUser.id,
                email: backendUser.email,
                name: backendUser.name || 'Unknown User',
                role: backendUser.role,
                serviceCenter: backendUser.serviceCenterId, // Map ID to serviceCenter property
                serviceCenterId: backendUser.serviceCenterId, // Also store as serviceCenterId
                serviceCenterName: backendUser.serviceCenterName || null,
                initials: backendUser.name
                    ? backendUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
                    : '??'
            };

            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Service] Mapped user:', user);
            }

            // Store the real token
            Cookies.set('auth_token', responseData.access_token, { expires: 7 });
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Service] Token stored in cookie');
            }

            const loginResponse: LoginResponse = {
                access_token: responseData.access_token,
                user
            };

            // Update auth store
            const { setAuth } = useAuthStore.getState();
            setAuth(user.role, user);
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Service] Auth store updated');
            }

            return loginResponse;
        } catch (error: any) {
            console.error('[Auth Service] Login failed:', error);
            console.error('[Auth Service] Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                response: error.response
            });
            throw error;
        }
    }

    /**
     * Logout and clear authentication
     */
    logout() {
        // Aggressively clear cookies by both removing and setting to empty with max-age: 0
        // This ensures middleware sees them as cleared
        Cookies.remove('auth_token', { path: '/' });
        Cookies.remove('auth_role', { path: '/' });
        
        // Also set to empty with immediate expiration as a fallback
        Cookies.set('auth_token', '', { expires: new Date(0), path: '/' });
        Cookies.set('auth_role', '', { expires: new Date(0), path: '/' });
        
        // Also clear from store
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = Cookies.get('auth_token');
        return !!token && token !== 'mock_token';
    }

    /**
     * Get current auth token
     */
    getToken(): string | undefined {
        return Cookies.get('auth_token');
    }
}

export const authService = new AuthService();
