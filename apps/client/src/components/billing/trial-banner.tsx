import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertIcon, AlertTitle, AlertToolbar } from "@/components/ui/alert";
import { Button } from "@learnbase/ui";
import { useSubscription } from "@/services/subscription";

function getDaysRemaining(trialEndsAt: string): number {
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type TrialBannerProps = {
  tenantSlug: string;
};

export function TrialBanner({ tenantSlug }: TrialBannerProps) {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription();

  if (!subscription) {
    return null;
  }

  const isPastDue = subscription.subscriptionStatus === "past_due";
  const isTrialing = subscription.subscriptionStatus === "trialing";

  const daysRemaining = subscription.trialEndsAt
    ? getDaysRemaining(subscription.trialEndsAt)
    : 0;

  const isLastDays = daysRemaining <= 3;
  const isUrgent = isPastDue || daysRemaining <= 2;

  if (!isPastDue && !(isTrialing && isLastDays)) {
    return null;
  }

  return (
    <Alert
      variant={isUrgent ? "destructive" : "primary"}
      appearance="light"
      size="sm"
      className="rounded-none border-x-0 border-t-0"
    >
      <AlertIcon>
        <Clock className="size-4" />
      </AlertIcon>
      <AlertTitle className="text-sm">
        {isPastDue
          ? t("subscription.trial.pastDue")
          : t("subscription.trial.daysRemaining", { count: daysRemaining })}
      </AlertTitle>
      <AlertToolbar>
        <Link to="/$tenantSlug/finance/subscription" params={{ tenantSlug }}>
          <Button size="xs" variant={isUrgent ? "destructive" : "primary"}>
            {t("subscription.trial.upgradeCta")}
          </Button>
        </Link>
      </AlertToolbar>
    </Alert>
  );
}
