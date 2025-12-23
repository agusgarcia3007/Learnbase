import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/services/subscription";

type TimeRemaining = {
  days: number;
  hours: number;
  isLessThanOneDay: boolean;
  isExpired: boolean;
};

function getTimeRemaining(trialEndsAt: string): TimeRemaining {
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.max(0, endDate.getTime() - now.getTime());
  const totalHours = diff / (1000 * 60 * 60);
  const hours = Math.max(1, Math.ceil(totalHours));
  const days = Math.floor(totalHours / 24);

  return {
    days,
    hours,
    isLessThanOneDay: diff > 0 && totalHours < 24,
    isExpired: diff === 0,
  };
}

type TrialBadgeProps = {
  tenantSlug: string;
};

export function TrialBadge({ tenantSlug }: TrialBadgeProps) {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription();

  if (!subscription) {
    return null;
  }

  const isPastDue = subscription.subscriptionStatus === "past_due";
  const isTrialing = subscription.subscriptionStatus === "trialing";
  const isTrialExpired = subscription.subscriptionStatus === "trial_expired";

  if (!isPastDue && !isTrialing && !isTrialExpired) {
    return null;
  }

  const timeRemaining = subscription.trialEndsAt
    ? getTimeRemaining(subscription.trialEndsAt)
    : { days: 0, hours: 0, isLessThanOneDay: false, isExpired: true };

  const isUrgent = isPastDue || isTrialExpired || timeRemaining.isExpired || timeRemaining.days <= 2;

  const getBadgeText = () => {
    if (isPastDue) return t("subscription.trial.pastDueBadge");
    if (isTrialExpired || timeRemaining.isExpired) return t("subscription.trial.expiredBadge");
    if (timeRemaining.isLessThanOneDay) {
      return t("subscription.trial.hoursBadge", { count: timeRemaining.hours });
    }
    return t("subscription.trial.daysBadge", { count: timeRemaining.days });
  };

  const getTooltipText = () => {
    if (isPastDue) return t("subscription.trial.pastDue");
    if (isTrialExpired || timeRemaining.isExpired) return t("subscription.trial.expired");
    if (timeRemaining.isLessThanOneDay) {
      return t("subscription.trial.hoursRemaining", { count: timeRemaining.hours });
    }
    return t("subscription.trial.daysRemaining", { count: timeRemaining.days });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/$tenantSlug/finance/subscription"
          params={{ tenantSlug }}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            isUrgent
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          <Clock className="size-3" />
          <span>{getBadgeText()}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {getTooltipText()}
        {" - "}
        {t("subscription.trial.clickToUpgrade")}
      </TooltipContent>
    </Tooltip>
  );
}
