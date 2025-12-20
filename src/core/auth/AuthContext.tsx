"use client";
import { ReactNode } from "react";
import { useRole } from "@/shared/hooks";
import type { UserRole, UserInfo } from "@/shared/types";

// Interface preserved for backward compatibility
interface AuthContextType {
  userRole: UserRole;
  userInfo: UserInfo | null;
  updateRole: (role: UserRole, user: UserInfo) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * @deprecated AuthProvider is no longer needed as state is managed by Zustand.
 * Kept for backward compatibility.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}

/**
 * Hook to access auth state
 * Now redirects to useRole() which uses Zustand
 */
export function useAuth(): AuthContextType {
  const { userRole, userInfo, updateRole, isLoading } = useRole();

  // Calculate specific auth properties
  const isAuthenticated = !!userInfo && userRole !== "admin";

  return {
    userRole,
    userInfo,
    updateRole,
    isLoading,
    isAuthenticated,
  };
}
