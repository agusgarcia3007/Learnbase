import { http } from "@/lib/http";

export type NotificationType =
  | "feature_approved"
  | "feature_rejected"
  | "feature_shipped"
  | "upcoming_features";

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: UserNotification[];
}

export interface UnreadCountResponse {
  count: number;
}

export const QUERY_KEYS = {
  NOTIFICATIONS: ["notifications"] as const,
  UNREAD_COUNT: ["notifications", "unread-count"] as const,
};

export const NotificationsService = {
  async getAll(): Promise<NotificationsResponse> {
    const { data } = await http.get<NotificationsResponse>("/notifications");
    return data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const { data } = await http.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return data;
  },

  async markAsRead(id: string): Promise<{ notification: UserNotification }> {
    const { data } = await http.put<{ notification: UserNotification }>(
      `/notifications/${id}/read`
    );
    return data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const { data } = await http.put<{ success: boolean }>(
      "/notifications/read-all"
    );
    return data;
  },
} as const;
