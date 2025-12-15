import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import {
  useSubscription,
  usePlans,
  useCreateSubscription,
  useCreatePortalSession,
} from "@/services/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import {
  Check,
  CreditCard,
  X,
  Users,
  BookOpen,
  HardDrive,
  Cpu,
  Percent,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanInfo, TenantPlan } from "@/services/billing/service";

export const Route = createFileRoute("/$tenantSlug/billing")({
  head: () =>
    createSeoMeta({
      title: "Billing",
      description: "Manage your subscription",
      noindex: true,
    }),
  component: BillingPage,
});

function FeatureItem({
  icon: Icon,
  label,
}: {
  icon: typeof Users;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <span className="text-sm">{label}</span>
    </li>
  );
}

function FeatureRow({ included, label }: { included: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 py-1",
        !included && "opacity-50"
      )}
    >
      {included ? (
        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10">
          <Check className="size-3 text-primary" />
        </div>
      ) : (
        <div className="flex size-5 items-center justify-center rounded-full bg-muted">
          <X className="size-3 text-muted-foreground" />
        </div>
      )}
      <span
        className={cn(
          "text-sm",
          included ? "text-foreground" : "text-muted-foreground line-through"
        )}
      >
        {label}
      </span>
    </li>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  isRecommended,
  onSelect,
  onManage,
  isLoading,
  hasSubscription,
  t,
}: {
  plan: PlanInfo;
  isCurrentPlan: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  onManage: () => void;
  isLoading: boolean;
  hasSubscription: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card",
        (isRecommended || isCurrentPlan) && "border-primary"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            {t("billing.plans.recommended")}
          </Badge>
        </div>
      )}

      <div
        className={cn(
          "border-b px-6 pb-6 pt-6 text-center",
          isRecommended && "pt-8"
        )}
      >
        <h3 className="text-xl font-semibold">
          {t(`billing.plans.${plan.id}`)}
        </h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">
            {formatPrice(plan.monthlyPrice, "USD")}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("billing.perMonth")}
          </span>
        </div>
        {isCurrentPlan && (
          <Badge variant="outline" className="mt-4 border-primary text-primary">
            {t("billing.currentPlan")}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <ul className="space-y-3">
          <FeatureItem
            icon={Users}
            label={
              plan.maxStudents
                ? t("billing.features.maxStudents", { count: plan.maxStudents })
                : t("billing.features.unlimitedStudents")
            }
          />
          <FeatureItem
            icon={BookOpen}
            label={
              plan.maxCourses
                ? t("billing.features.maxCourses", { count: plan.maxCourses })
                : t("billing.features.unlimitedCourses")
            }
          />
          <FeatureItem
            icon={HardDrive}
            label={t("billing.features.storage", { size: plan.storageGb })}
          />
          <FeatureItem
            icon={Cpu}
            label={t("billing.features.ai", {
              type: t(`billing.aiTypes.${plan.aiGeneration}`),
            })}
          />
          <FeatureItem
            icon={Percent}
            label={t("billing.features.commission", {
              rate: plan.commissionRate,
            })}
          />
        </ul>

        <div className="my-5 h-px bg-border" />

        <ul className="flex-1 space-y-2">
          <FeatureRow
            included={plan.certificates}
            label={t("billing.features.certificates")}
          />
          <FeatureRow
            included={plan.customDomain}
            label={t("billing.features.customDomain")}
          />
          <FeatureRow
            included={plan.analytics}
            label={t("billing.features.analytics")}
          />
          <FeatureRow
            included={plan.prioritySupport}
            label={t("billing.features.prioritySupport")}
          />
          <FeatureRow
            included={plan.whiteLabel}
            label={t("billing.features.whiteLabel")}
          />
        </ul>

        <div className="mt-6">
          {isCurrentPlan && hasSubscription ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onManage}
              isLoading={isLoading}
            >
              <CreditCard className="size-4" />
              {t("billing.manageBilling")}
            </Button>
          ) : isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              {t("billing.currentPlan")}
            </Button>
          ) : (
            <Button
              className="w-full gap-2"
              variant={isRecommended ? "default" : "secondary"}
              onClick={onSelect}
              isLoading={isLoading}
            >
              {t("billing.selectPlan")}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const isNegative = status === "past_due" || status === "canceled" || status === "unpaid";

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

      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="space-y-4 text-center">
              <Skeleton className="mx-auto h-6 w-24" />
              <Skeleton className="mx-auto h-10 w-20" />
            </div>
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingPage() {
  const { t } = useTranslation();
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

  const currentPlan = subscription?.plan;
  const status = subscription?.subscriptionStatus;
  const hasSubscription = Boolean(subscription?.stripeCustomerId);
  const plans = plansData?.plans ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
            <p className="text-muted-foreground">{t("billing.description")}</p>
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = hasSubscription && currentPlan === plan.id;
          const isRecommended = plan.id === "growth";

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan}
              isRecommended={isRecommended}
              onSelect={() => handleSelectPlan(plan.id as TenantPlan)}
              onManage={handleManageBilling}
              isLoading={isCreating || isOpeningPortal}
              hasSubscription={hasSubscription}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
