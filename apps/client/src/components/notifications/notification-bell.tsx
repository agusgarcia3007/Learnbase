import { useState } from "react";
import { Bell, Clock, Mail, ExternalLink, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSubscription } from "@/services/subscription";
import { useResendVerification } from "@/services/auth/mutations";
import { cn } from "@/lib/utils";

const READ_NOTIFICATIONS_KEY = "read-notifications";

type NotificationType = "trial" | "verification";

function getReadNotifications(): Set<NotificationType> {
  const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  if (!stored) return new Set();
  return new Set(JSON.parse(stored) as NotificationType[]);
}

function markAsRead(type: NotificationType): void {
  const current = getReadNotifications();
  current.add(type);
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...current]));
}

function clearReadStatus(type: NotificationType): void {
  const current = getReadNotifications();
  current.delete(type);
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

export function NotificationBell({
  tenantSlug,
  userRole,
  emailVerified,
}: NotificationBellProps) {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription();
  const { mutate: resendVerification, isPending } = useResendVerification();
  const [readNotifications, setReadNotifications] = useState(getReadNotifications);
  const [open, setOpen] = useState(false);

  const notifications: {
    type: NotificationType;
    icon: typeof Clock;
    title: string;
    description: string;
    variant: "warning" | "destructive";
    action?: React.ReactNode;
  }[] = [];

  const isTrialing = subscription?.subscriptionStatus === "trialing";
  const isPastDue = subscription?.subscriptionStatus === "past_due";
  const showTrialNotification = isTrialing || isPastDue;

  if (showTrialNotification) {
    const daysRemaining = subscription?.trialEndsAt
      ? getDaysRemaining(subscription.trialEndsAt)
      : 0;
    const isUrgent = isPastDue || daysRemaining <= 2;

    notifications.push({
      type: "trial",
      icon: Clock,
      title: isPastDue
        ? t("notifications.trial.pastDueTitle")
        : t("notifications.trial.title"),
      description: isPastDue
        ? t("notifications.trial.pastDueDescription")
        : t("notifications.trial.description", { count: daysRemaining }),
      variant: isUrgent ? "destructive" : "warning",
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
    notifications.push({
      type: "verification",
      icon: Mail,
      title: t("notifications.verification.title"),
      description: t("notifications.verification.description"),
      variant: "warning",
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
          isLoading={isPending}
        >
          {t("notifications.verification.action")}
        </Button>
      ),
    });
  }

  const unreadCount = notifications.filter(
    (n) => !readNotifications.has(n.type)
  ).length;

  const handleMarkAsRead = (type: NotificationType) => {
    markAsRead(type);
    setReadNotifications(new Set(readNotifications).add(type));
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((n) => markAsRead(n.type));
    setReadNotifications(new Set(notifications.map((n) => n.type)));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-medium">{t("notifications.title")}</h4>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => {
            const isRead = readNotifications.has(notification.type);
            const Icon = notification.icon;

            return (
              <div
                key={notification.type}
                className={cn(
                  "border-b px-4 py-3 last:border-b-0",
                  !isRead && "bg-muted/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 rounded-full p-1.5",
                      notification.variant === "destructive"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      {!isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.type)}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          title={t("notifications.markRead")}
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
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
