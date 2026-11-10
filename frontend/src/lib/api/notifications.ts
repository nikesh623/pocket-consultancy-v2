import { apiClient } from "./client";
import { NotificationItem, NotificationListResponse } from "@/types/api";

export const notificationsApi = {
  listNotifications: async (params?: {
    unread_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<NotificationListResponse> => {
    const query = new URLSearchParams();
    if (params?.unread_only !== undefined) query.set("unread_only", params.unread_only.toString());
    if (params?.skip) query.set("skip", params.skip.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    return apiClient<NotificationListResponse>(`/api/v1/notifications/?${query.toString()}`);
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    return apiClient<{ unread_count: number }>("/api/v1/notifications/unread-count");
  },

  markAsRead: async (notificationId: string): Promise<NotificationItem> => {
    return apiClient<NotificationItem>(`/api/v1/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead: async (): Promise<{ updated_count: number }> => {
    return apiClient<{ updated_count: number }>("/api/v1/notifications/read-all", {
      method: "POST",
    });
  },
};
