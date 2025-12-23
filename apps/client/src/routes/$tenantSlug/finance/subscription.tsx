import { PricingOverlay } from "@/components/pricing-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/format";
import { createSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  useCreatePortalSession,
  useCreateSubscription,
  usePlans,
  useSubscription,
} from "@/services/subscription";
import type {
  SubscriptionResponse,
  TenantPlan,
} from "@/services/subscription/service";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  CreditCard,
  ExternalLink,
  HardDrive,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$tenantSlug/finance/subscription")({
  head: () =>
    createSeoMeta({
      title: "Subscription",
      description: "Manage your platform subscription",
      noindex: true,
    }),
  component: SubscriptionPage,
});

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const isNegative =
    status === "past_due" || status === "canceled" || status === "unpaid";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        isNegative
          ? "border-destructive/50 text-destructive"
          : "border-primary/50 text-primary"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isNegative ? "bg-destructive" : "bg-primary"
        )}
      />
      {t(`subscription.status.${status}`)}
    </Badge>
  );
}

function StorageCard({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const { t } = useTranslation();
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t("subscription.usage.storage")}
        </CardTitle>
        <HardDrive className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatBytes(used)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}/ {formatBytes(limit)}
          </span>
        </div>
        <Progress
          value={percentage}
          className="mt-3 h-2"
          aria-label={t("subscription.usage.progress", {
            percentage: Math.round(percentage),
          })}
        />
      </CardContent>
    </Card>
  );
}

function CurrentPlanCard({
  subscription,
  onManageBilling,
  onChangePlan,
  isLoading,
}: {
  subscription: SubscriptionResponse;
  onManageBilling: () => void;
  onChangePlan: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">
                {subscription.plan
                  ? t(`subscription.plans.${subscription.plan}`)
                  : t("subscription.noPlan")}
              </span>
              {subscription.subscriptionStatus && (
                <div className="mt-1">
                  <StatusBadge status={subscription.subscriptionStatus} />
                </div>
              )}
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 gap-2" onClick={onChangePlan}>
            {t("subscription.changePlan")}
            <ArrowRight className="size-4" />
          </Button>
          {subscription.stripeCustomerId && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={onManageBilling}
              isLoading={isLoading}
            >
              <ExternalLink className="size-4" />
              {t("subscription.manageBilling")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-2 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionContent({
  subscription,
  onManageBilling,
  onChangePlan,
  isLoadingPortal,
}: {
  subscription: SubscriptionResponse;
  onManageBilling: () => void;
  onChangePlan: () => void;
  isLoadingPortal: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("subscription.title")}</h1>
          <p className="text-muted-foreground">{t("subscription.description")}</p>
        </div>
      </div>

      <StorageCard
        used={subscription.storageUsedBytes}
        limit={subscription.storageLimitBytes}
      />

      <CurrentPlanCard
        subscription={subscription}
        onManageBilling={onManageBilling}
        onChangePlan={onChangePlan}
        isLoading={isLoadingPortal}
      />
    </div>
  );
}

function TrialExpiredForNonOwner() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
        <Clock className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">
        {t("subscription.trialExpiredTitle")}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t("subscription.contactOwner")}
      </p>
    </div>
  );
}

function SubscriptionPage() {
  const { user } = Route.useRouteContext();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { data: subscription, isLoading: isLoadingSubscription } =
    useSubscription();
  const { data: plansData, isLoading: isLoadingPlans } = usePlans();
  const { mutate: createSubscription, isPending: isCreating } =
    useCreateSubscription();
  const { mutate: createPortal, isPending: isOpeningPortal } =
    useCreatePortalSession();

  const handleSelectPlan = (plan: TenantPlan) => {
    createSubscription(plan, {
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
    });
  };

  const handleManageBilling = () => {
    createPortal(undefined, {
      onSuccess: (data) => {
        window.location.href = data.portalUrl;
      },
    });
  };

  if (isLoadingSubscription || isLoadingPlans) {
    return <SubscriptionPageSkeleton />;
  }

  const hasValidSubscription = subscription?.hasValidSubscription ?? false;

  if (!hasValidSubscription && user.role !== "owner" && user.role !== "superadmin") {
    return <TrialExpiredForNonOwner />;
  }

  const showOverlay = !hasValidSubscription || showPricingModal;
  const canClose = hasValidSubscription && showPricingModal;
  const plans = plansData?.plans ?? [];

  const trialExpired =
    subscription?.subscriptionStatus === "trial_expired" ||
    (subscription?.trialEndsAt &&
      new Date(subscription.trialEndsAt) <= new Date() &&
      subscription.subscriptionStatus !== "active");

  return (
    <>
      <SubscriptionContent
        subscription={subscription!}
        onManageBilling={handleManageBilling}
        onChangePlan={() => setShowPricingModal(true)}
        isLoadingPortal={isOpeningPortal}
      />

      {showOverlay && (
        <PricingOverlay
          plans={plans}
          onSelectPlan={handleSelectPlan}
          isLoading={isCreating}
          canClose={canClose}
          onClose={() => setShowPricingModal(false)}
          trialExpired={Boolean(trialExpired)}
        />
      )}
    </>
  );
}
