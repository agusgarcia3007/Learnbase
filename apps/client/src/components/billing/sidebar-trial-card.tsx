import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/services/subscription";

function getDaysRemaining(trialEndsAt: string): number {
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type SidebarTrialCardProps = {
  tenantSlug: string;
};

export function SidebarTrialCard({ tenantSlug }: SidebarTrialCardProps) {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const { data: subscription } = useSubscription();

  if (!subscription) {
    return null;
  }

  const isTrialing = subscription.subscriptionStatus === "trialing";
  const isPastDue = subscription.subscriptionStatus === "past_due";

  if (!isTrialing && !isPastDue) {
    return null;
  }

  const daysRemaining = subscription.trialEndsAt
    ? getDaysRemaining(subscription.trialEndsAt)
    : 0;

  const isUrgent = isPastDue || daysRemaining <= 2;

  if (!open) {
    return (
      <SidebarMenu className="px-2 pb-2">
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                asChild
                className={
                  isUrgent
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-warning/10 text-warning-foreground hover:bg-warning/20"
                }
              >
                <Link to="/$tenantSlug/finance/subscription" params={{ tenantSlug }}>
                  <div className="relative">
                    <Clock className="size-4" />
                    <span
                      className={`absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        isUrgent
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-warning text-warning-foreground"
                      }`}
                    >
                      {daysRemaining}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isPastDue
                ? t("billing.trial.pastDue")
                : t("billing.trial.daysRemaining", { count: daysRemaining })}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="px-2 pb-2">
      <div
        className={`rounded-lg border p-3 ${
          isUrgent
            ? "border-destructive/30 bg-destructive/10"
            : "border-warning/30 bg-warning/10"
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4 shrink-0" />
          <span>
            {isPastDue
              ? t("billing.trial.pastDue")
              : t("billing.trial.daysRemaining", { count: daysRemaining })}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("billing.trial.upgradeNow")}
        </p>
        <Link
          to="/$tenantSlug/finance/subscription"
          params={{ tenantSlug }}
          className="mt-2 block"
        >
          <Button
            size="sm"
            className="w-full"
            variant={isUrgent ? "destructive" : "primary"}
          >
            {t("billing.trial.upgradeCta")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
