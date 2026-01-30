import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { UserRole, UserInfo } from '@/shared/types/auth.types';

interface AuthState {
    userRole: UserRole;
    userInfo: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setAuth: (role: UserRole, user: UserInfo) => void;
    clearAuth: () => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            userRole: 'admin', // Default role as per current implementation
            userInfo: null,
            isLoading: false,
            isAuthenticated: false,

            setAuth: (role, user) => {
                // Sync with Cookie for Middleware - set with path and sameSite for cross-page access
                Cookies.set('auth_role', role, { expires: 7, path: '/', sameSite: 'lax' });
                // Note: auth_token is now set by auth.service.ts during actual login

                set({
                    userRole: role,
                    userInfo: user,
                    isAuthenticated: !!user
                });
            },

            clearAuth: () => {
                // Aggressively clear cookies by both removing and setting to empty with max-age: 0
                Cookies.remove('auth_role', { path: '/' });
                Cookies.remove('auth_token', { path: '/' });
                
                // Also set to empty with immediate expiration as a fallback
                Cookies.set('auth_role', '', { expires: new Date(0), path: '/' });
                Cookies.set('auth_token', '', { expires: new Date(0), path: '/' });

                set({
                    userRole: 'admin',
                    userInfo: null,
                    isAuthenticated: false
                });
            },

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'dms-auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
