import { useState } from "react";
import { Bell, Clock, Mail, Check, Sparkles, XCircle, Rocket } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@learnbase/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";
import { useSubscription } from "@/services/subscription";
import { useResendVerification } from "@/services/auth/mutations";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  type UserNotification,
} from "@/services/notifications";
import { cn } from "@/lib/utils";

const READ_NOTIFICATIONS_KEY = "read-notifications";

type LocalNotificationType = "trial" | "verification";

function getReadNotifications(): Set<LocalNotificationType> {
  const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  if (!stored) return new Set();
  return new Set(JSON.parse(stored) as LocalNotificationType[]);
}

function markLocalAsRead(type: LocalNotificationType): void {
  const current = getReadNotifications();
  current.add(type);
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...current]));
}

function getDaysRemaining(trialEndsAt: string): number {
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type NotificationBellProps = {
  tenantSlug: string;
  userRole: string;
  emailVerified: boolean;
};

type NotificationItem = {
  id: string;
  type: LocalNotificationType | UserNotification["type"];
  icon: typeof Clock;
  title: string;
  description: string;
  variant: "warning" | "destructive" | "info" | "success";
  action?: React.ReactNode;
  isRead: boolean;
  isLocal: boolean;
  createdAt?: string;
};

const notificationIcons: Record<UserNotification["type"], typeof Sparkles> = {
  feature_approved: Sparkles,
  feature_rejected: XCircle,
  feature_shipped: Rocket,
  upcoming_features: Sparkles,
};

const notificationVariants: Record<UserNotification["type"], NotificationItem["variant"]> = {
  feature_approved: "success",
  feature_rejected: "info",
  feature_shipped: "success",
  upcoming_features: "info",
};

export function NotificationBell({
  tenantSlug,
  userRole,
  emailVerified,
}: NotificationBellProps) {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription({
    enabled: userRole !== "instructor",
  });
  const { mutate: resendVerification, isPending: isResending } =
    useResendVerification();
  const [readLocalNotifications, setReadLocalNotifications] = useState(
    getReadNotifications
  );
  const [open, setOpen] = useState(false);

  const { data: apiNotifications } = useNotifications();
  const { data: unreadCountData } = useUnreadCount();
  const { mutate: markAsReadApi } = useMarkAsRead();
  const { mutate: markAllAsReadApi } = useMarkAllAsRead();

  const localNotifications: NotificationItem[] = [];

  const isTrialing = subscription?.subscriptionStatus === "trialing";
  const isPastDue = subscription?.subscriptionStatus === "past_due";
  const showTrialNotification = isTrialing || isPastDue;

  if (showTrialNotification) {
    const daysRemaining = subscription?.trialEndsAt
      ? getDaysRemaining(subscription.trialEndsAt)
      : 0;
    const isUrgent = isPastDue || daysRemaining <= 2;

    localNotifications.push({
      id: "trial",
      type: "trial",
      icon: Clock,
      title: isPastDue
        ? t("notifications.trial.pastDueTitle")
        : t("notifications.trial.title"),
      description: isPastDue
        ? t("notifications.trial.pastDueDescription")
        : t("notifications.trial.description", { count: daysRemaining }),
      variant: isUrgent ? "destructive" : "warning",
      isRead: readLocalNotifications.has("trial"),
      isLocal: true,
      action: (
        <Link
          to="/$tenantSlug/finance/subscription"
          params={{ tenantSlug }}
          onClick={() => setOpen(false)}
        >
          <Button size="xs" variant={isUrgent ? "destructive" : "primary"}>
            {t("notifications.trial.action")}
          </Button>
        </Link>
      ),
    });
  }

  const showVerificationNotification =
    !emailVerified && userRole === "owner";

  if (showVerificationNotification) {
    localNotifications.push({
      id: "verification",
      type: "verification",
      icon: Mail,
      title: t("notifications.verification.title"),
      description: t("notifications.verification.description"),
      variant: "warning",
      isRead: readLocalNotifications.has("verification"),
      isLocal: true,
      action: (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            resendVerification(undefined, {
              onSuccess: () => {
                toast.success(t("auth.emailVerification.resendSuccess"));
              },
            });
          }}
          isLoading={isResending}
        >
          {t("notifications.verification.action")}
        </Button>
      ),
    });
  }

  const apiNotificationItems: NotificationItem[] = (
    apiNotifications?.notifications ?? []
  ).map((n) => ({
    id: n.id,
    type: n.type,
    icon: notificationIcons[n.type],
    title: n.title,
    description: n.message,
    variant: notificationVariants[n.type],
    isRead: n.isRead,
    isLocal: false,
    createdAt: n.createdAt,
  }));

  const allNotifications = [...localNotifications, ...apiNotificationItems];

  const localUnreadCount = localNotifications.filter((n) => !n.isRead).length;
  const apiUnreadCount = unreadCountData?.count ?? 0;
  const totalUnreadCount = localUnreadCount + apiUnreadCount;

  const handleMarkAsRead = (notification: NotificationItem) => {
    if (notification.isLocal) {
      markLocalAsRead(notification.type as LocalNotificationType);
      setReadLocalNotifications(
        new Set(readLocalNotifications).add(
          notification.type as LocalNotificationType
        )
      );
    } else {
      markAsReadApi(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    localNotifications.forEach((n) => {
      if (!n.isRead) {
        markLocalAsRead(n.type as LocalNotificationType);
      }
    });
    setReadLocalNotifications(
      new Set(localNotifications.map((n) => n.type as LocalNotificationType))
    );

    if (apiUnreadCount > 0) {
      markAllAsReadApi();
    }
  };

  if (allNotifications.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-medium">{t("notifications.title")}</h4>
          {totalUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-muted-foreground text-xs hover:text-foreground"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {allNotifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  "border-b px-4 py-3 last:border-b-0",
                  !notification.isRead && "bg-muted/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 rounded-full p-1.5",
                      notification.variant === "destructive" &&
                        "bg-destructive/10 text-destructive",
                      notification.variant === "warning" &&
                        "bg-warning/10 text-warning",
                      notification.variant === "info" &&
                        "bg-primary/10 text-primary",
                      notification.variant === "success" &&
                        "bg-green-500/10 text-green-600"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          title={t("notifications.markRead")}
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {notification.description}
                    </p>
                    {notification.createdAt && (
                      <p className="text-muted-foreground/70 text-xs">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                    {notification.action && (
                      <div className="pt-2">{notification.action}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
