import { useTranslation } from "react-i18next";
import { ArrowRight, Calendar } from "lucide-react";

import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import {
  useSubscriptionHistory,
  type BackofficeSubscription,
} from "@/services/backoffice-subscriptions";

type SubscriptionHistoryDialogProps = {
  subscription: BackofficeSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "customer.subscription.created":
      return "Subscription Created";
    case "customer.subscription.updated":
      return "Subscription Updated";
    case "customer.subscription.deleted":
      return "Subscription Canceled";
    default:
      return eventType;
  }
}

export function SubscriptionHistoryDialog({
  subscription,
  open,
  onOpenChange,
}: SubscriptionHistoryDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useSubscriptionHistory(subscription?.id ?? "");

  const history = data?.history ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("backoffice.subscriptions.history.title")}</DialogTitle>
          <DialogDescription>
            {t("backoffice.subscriptions.history.description", {
              tenant: subscription?.tenantName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("backoffice.subscriptions.history.noHistory")}
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">
                      {t(`backoffice.subscriptions.history.eventTypes.${entry.eventType}`, {
                        defaultValue: getEventTypeLabel(entry.eventType),
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                    {(entry.previousPlan || entry.newPlan) && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-muted-foreground">Plan:</span>
                        {entry.previousPlan && (
                          <span className="px-2 py-0.5 rounded bg-muted">
                            {t(`backoffice.subscriptions.plans.${entry.previousPlan}`)}
                          </span>
                        )}
                        {entry.previousPlan && entry.newPlan && (
                          <ArrowRight className="size-3 text-muted-foreground" />
                        )}
                        {entry.newPlan && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {t(`backoffice.subscriptions.plans.${entry.newPlan}`)}
                          </span>
                        )}
                      </div>
                    )}
                    {(entry.previousStatus || entry.newStatus) && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-muted-foreground">Status:</span>
                        {entry.previousStatus && (
                          <span className="px-2 py-0.5 rounded bg-muted">
                            {t(`backoffice.subscriptions.statuses.${entry.previousStatus}`)}
                          </span>
                        )}
                        {entry.previousStatus && entry.newStatus && (
                          <ArrowRight className="size-3 text-muted-foreground" />
                        )}
                        {entry.newStatus && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {t(`backoffice.subscriptions.statuses.${entry.newStatus}`)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
