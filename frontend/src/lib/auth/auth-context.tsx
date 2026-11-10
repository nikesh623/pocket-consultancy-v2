"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/api/client";
import { User, UserRole } from "@/types/api";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string | null;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch {
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authApi.login({ email, password });
      const currentUser = await authApi.getMe();
      setUser(currentUser);

      // Redirect based on role
      switch (currentUser.role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "counselor":
          router.push("/dashboard/counselor");
          break;
        case "documentation_officer":
          router.push("/dashboard/documentation");
          break;
        case "student":
        default:
          router.push("/dashboard/student");
          break;
      }

      return { success: true, role: currentUser.role };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      return { success: false, error: message };
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string | null;
  }) => {
    try {
      const createdUser = await authApi.register(payload);
      return { success: true, user: createdUser };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    try {
      const updated = await authApi.getMe();
      setUser(updated);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
