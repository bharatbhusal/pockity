"use client";

import { api } from "@/lib/apiClient";
import type { ApiKey, User } from "@/types/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  apiKeys?: ApiKey[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      try {
        const response = await api.user.getProfile();
        return response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/auth/signIn");
    },
  });

  const value: AuthContextType = {
    user: userData?.user || null,
    apiKeys: userData?.apiKeys || [],
    isLoading,
    isAuthenticated: !!userData,
    isAdmin: userData?.user.role === "ADMIN",
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route component
export function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signIn");
      } else if (requireAdmin && !isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
