// Pocket Consultancy V2 - Centralized API Integration Client

import { TokenResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Token storage helpers
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pc_access_token");
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pc_refresh_token");
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pc_access_token", accessToken);
    localStorage.setItem("pc_refresh_token", refreshToken);
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("pc_access_token");
    localStorage.removeItem("pc_refresh_token");
    localStorage.removeItem("pc_user");
  },
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data: TokenResponse = await res.json();
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Add Auth token if available
  const token = tokenStorage.getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default JSON Content-Type if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiration with Automatic Refresh
  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        tokenStorage.clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
      }
    } else {
      // Queue requests while refreshing
      const retryOriginalRequest = new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          try {
            headers.set("Authorization", `Bearer ${newToken}`);
            const retryRes = await fetch(url, { ...options, headers });
            if (!retryRes.ok) {
              const errData = await retryRes.json().catch(() => ({}));
              reject(new ApiError(retryRes.status, errData.detail || "Request failed", errData));
            } else {
              resolve(await retryRes.json());
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      return retryOriginalRequest;
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    let errorData = null;
    try {
      errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map((e: { msg?: string }) => e.msg || "").join(", ");
      } else if (errorData.error && errorData.error.message) {
        errorDetail = errorData.error.message;
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Download blob helper for authenticated file retrieval
export async function downloadFileBlob(endpoint: string): Promise<Blob> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers();
  const token = tokenStorage.getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    throw new ApiError(response.status, "Failed to download document file.");
  }

  return response.blob();
}
