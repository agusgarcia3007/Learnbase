import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import {
  NotificationsService,
  QUERY_KEYS,
  type NotificationsResponse,
} from "./service";

export const notificationsOptions = () =>
  queryOptions({
    queryFn: () => NotificationsService.getAll(),
    queryKey: QUERY_KEYS.NOTIFICATIONS,
  });

export const unreadCountOptions = () =>
  queryOptions({
    queryFn: () => NotificationsService.getUnreadCount(),
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    refetchInterval: 30000,
  });

export const useMarkAsReadOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => NotificationsService.markAsRead(id),
    onSuccess: (data) => {
      queryClient.setQueryData<NotificationsResponse>(
        QUERY_KEYS.NOTIFICATIONS,
        (old) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) =>
              n.id === data.notification.id ? data.notification : n
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT });
    },
  });
};

export const useMarkAllAsReadOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: () => NotificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(
        QUERY_KEYS.NOTIFICATIONS,
        (old) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          };
        }
      );
      queryClient.setQueryData(QUERY_KEYS.UNREAD_COUNT, { count: 0 });
    },
  });
};
