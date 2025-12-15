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
} from "@/services/billing";
import type {
  SubscriptionResponse,
  TenantPlan,
} from "@/services/billing/service";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  ExternalLink,
  HardDrive,
  Percent,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$tenantSlug/billing")({
  head: () =>
    createSeoMeta({
      title: "Billing",
      description: "Manage your subscription",
      noindex: true,
    }),
  component: BillingPage,
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
      {t(`billing.status.${status}`)}
    </Badge>
  );
}

function UsageCard({
  icon: Icon,
  title,
  used,
  limit,
  formatValue,
}: {
  icon: typeof HardDrive;
  title: string;
  used: number;
  limit: number | null;
  formatValue?: (value: number) => string;
}) {
  const { t } = useTranslation();
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const format = formatValue || ((v: number) => v.toString());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format(used)}
          {limit && (
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {format(limit)}
            </span>
          )}
        </div>
        {limit && (
          <Progress
            value={percentage}
            className="mt-3 h-2"
            aria-label={t("billing.usage.progress", {
              percentage: Math.round(percentage),
            })}
          />
        )}
        {!limit && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("billing.usage.unlimited")}
          </p>
        )}
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
                  ? t(`billing.plans.${subscription.plan}`)
                  : t("billing.noPlan")}
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Percent className="size-4" />
          <span>
            {t("billing.features.commission", {
              rate: subscription.commissionRate,
            })}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 gap-2" onClick={onChangePlan}>
            {t("billing.changePlan")}
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
              {t("billing.manageBilling")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-3 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

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

function BillingContent({
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
          <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.description")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <UsageCard
          icon={HardDrive}
          title={t("billing.usage.storage")}
          used={subscription.storageUsedBytes}
          limit={subscription.storageLimitBytes}
          formatValue={formatBytes}
        />
        <UsageCard
          icon={Users}
          title={t("billing.usage.students")}
          used={0}
          limit={null}
        />
        <UsageCard
          icon={BookOpen}
          title={t("billing.usage.courses")}
          used={0}
          limit={null}
        />
      </div>

      <CurrentPlanCard
        subscription={subscription}
        onManageBilling={onManageBilling}
        onChangePlan={onChangePlan}
        isLoading={isLoadingPortal}
      />
    </div>
  );
}

function BillingPage() {
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
    return <BillingPageSkeleton />;
  }

  const hasSubscription = subscription?.hasSubscription ?? false;
  const showOverlay = !hasSubscription || showPricingModal;
  const canClose = hasSubscription && showPricingModal;
  const plans = plansData?.plans ?? [];

  return (
    <>
      <BillingContent
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
        />
      )}
    </>
  );
}
