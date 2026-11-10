import { apiClient, tokenStorage } from "./client";
import { TokenResponse, User } from "@/types/api";

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<TokenResponse> => {
    const data = await apiClient<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string | null;
  }): Promise<User> => {
    return apiClient<User>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMe: async (): Promise<User> => {
    const user = await apiClient<User>("/api/v1/auth/me");
    if (typeof window !== "undefined") {
      localStorage.setItem("pc_user", JSON.stringify(user));
    }
    return user;
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    tokenStorage.clearTokens();
  },
};
