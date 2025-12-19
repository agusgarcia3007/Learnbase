import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { notificationsOptions, unreadCountOptions } from "./options";

export const useNotifications = () => useQuery(notificationsOptions());

export const useNotificationsSuspense = () =>
  useSuspenseQuery(notificationsOptions());

export const useUnreadCount = () => useQuery(unreadCountOptions());

export const useUnreadCountSuspense = () =>
  useSuspenseQuery(unreadCountOptions());
