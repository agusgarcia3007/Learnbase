import { Alert, AlertIcon, AlertTitle, AlertToolbar } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/services/billing";
import { Clock, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

const DISMISS_KEY = "trial-banner-dismissed";
const DISMISS_DURATION = 4 * 60 * 60 * 1000;

function isDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  if (Date.now() - dismissedAt > DISMISS_DURATION) {
    localStorage.removeItem(DISMISS_KEY);
    return false;
  }
  return true;
}

function dismissBanner(): void {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

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
  const [dismissed, setDismissed] = useState(isDismissed);
  const { data: subscription } = useSubscription();

  if (dismissed || !subscription) {
    return null;
  }

  const isTrialing = subscription.subscriptionStatus === "trialing";
  const isPastDue = subscription.subscriptionStatus === "past_due";

  if (!isTrialing && !isPastDue) {
    return null;
  }

  const handleDismiss = () => {
    dismissBanner();
    setDismissed(true);
  };

  const daysRemaining = subscription.trialEndsAt
    ? getDaysRemaining(subscription.trialEndsAt)
    : 0;

  const variant = isPastDue || daysRemaining <= 2 ? "destructive" : "warning";

  return (
    <Alert variant={variant} appearance="light" size="sm" className="rounded-none border-x-0 border-t-0">
      <AlertIcon>
        <Clock className="size-4" />
      </AlertIcon>
      <AlertTitle className="flex items-center gap-2 text-sm">
        {isPastDue ? (
          <span>{t("billing.trial.pastDue")}</span>
        ) : (
          <>
            <span>
              {t("billing.trial.daysRemaining", { count: daysRemaining })}
            </span>
            <span className="hidden text-muted-foreground sm:inline">
              {t("billing.trial.upgradeNow")}
            </span>
          </>
        )}
      </AlertTitle>
      <AlertToolbar className="flex items-center gap-2">
        <Link to="/$tenantSlug/billing" params={{ tenantSlug }}>
          <Button variant="outline" size="xs">
            {t("billing.trial.upgradeCta")}
          </Button>
        </Link>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </AlertToolbar>
    </Alert>
  );
}
