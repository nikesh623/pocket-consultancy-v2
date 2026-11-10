import { apiClient } from "./client";
import { AccountStatus, User, UserListResponse, UserRole } from "@/types/api";

export const usersApi = {
  listUsers: async (params?: {
    role?: UserRole;
    account_status?: AccountStatus;
    page?: number;
    size?: number;
  }): Promise<UserListResponse> => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.account_status) query.set("account_status", params.account_status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.size) query.set("size", params.size.toString());

    return apiClient<UserListResponse>(`/api/v1/users/?${query.toString()}`);
  },

  createInternalUser: async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone_number?: string | null;
  }): Promise<User> => {
    return apiClient<User>("/api/v1/users/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getUser: async (userId: string): Promise<User> => {
    return apiClient<User>(`/api/v1/users/${userId}`);
  },

  updateUserStatus: async (
    userId: string,
    status: AccountStatus,
    rejectionReason?: string
  ): Promise<User> => {
    return apiClient<User>(`/api/v1/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        account_status: status,
        rejection_reason: rejectionReason,
      }),
    });
  },
};
