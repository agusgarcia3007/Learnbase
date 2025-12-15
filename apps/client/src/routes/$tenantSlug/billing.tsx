import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { useSubscription, usePlans, useCreateSubscription, useCreatePortalSession } from "@/services/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { Check, CreditCard, Loader2, Sparkles, X } from "lucide-react";
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

function FeatureRow({ included, label }: { included: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <Check className="size-4 shrink-0 text-green-500" />
      ) : (
        <X className="size-4 shrink-0 text-muted-foreground/50" />
      )}
      <span className={cn(!included && "text-muted-foreground")}>{label}</span>
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
    <Card
      className={cn(
        "relative flex flex-col",
        isRecommended && "border-primary shadow-lg",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1">
            <Sparkles className="size-3" />
            {t("billing.plans.recommended")}
          </Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>{t(`billing.plans.${plan.id}`)}</span>
          {isCurrentPlan && (
            <Badge variant="secondary">{t("billing.currentPlan")}</Badge>
          )}
        </CardTitle>
        <div className="pt-2">
          <span className="text-4xl font-bold">
            {formatPrice(plan.monthlyPrice, "USD")}
          </span>
          <span className="text-muted-foreground">{t("billing.perMonth")}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <ul className="flex-1 space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-green-500" />
            <span>
              {plan.maxStudents
                ? t("billing.features.maxStudents", { count: plan.maxStudents })
                : t("billing.features.unlimitedStudents")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-green-500" />
            <span>
              {plan.maxCourses
                ? t("billing.features.maxCourses", { count: plan.maxCourses })
                : t("billing.features.unlimitedCourses")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-green-500" />
            <span>{t("billing.features.storage", { size: plan.storageGb })}</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-green-500" />
            <span>{t("billing.features.ai", { type: t(`billing.aiTypes.${plan.aiGeneration}`) })}</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-green-500" />
            <span>{t("billing.features.commission", { rate: plan.commissionRate })}</span>
          </li>
          <FeatureRow included={plan.certificates} label={t("billing.features.certificates")} />
          <FeatureRow included={plan.customDomain} label={t("billing.features.customDomain")} />
          <FeatureRow included={plan.analytics} label={t("billing.features.analytics")} />
          <FeatureRow included={plan.prioritySupport} label={t("billing.features.prioritySupport")} />
          <FeatureRow included={plan.whiteLabel} label={t("billing.features.whiteLabel")} />
        </ul>
        {isCurrentPlan && hasSubscription ? (
          <Button variant="outline" className="w-full" onClick={onManage} isLoading={isLoading}>
            <CreditCard className="mr-2 size-4" />
            {t("billing.manageBilling")}
          </Button>
        ) : isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            {t("billing.currentPlan")}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isRecommended ? "default" : "outline"}
            onClick={onSelect}
            isLoading={isLoading}
          >
            {t("billing.selectPlan")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function BillingPage() {
  const { t } = useTranslation();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: plansData, isLoading: isLoadingPlans } = usePlans();
  const { mutate: createSubscription, isPending: isCreating } = useCreateSubscription();
  const { mutate: createPortal, isPending: isOpeningPortal } = useCreatePortalSession();

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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = subscription?.plan;
  const status = subscription?.subscriptionStatus;
  const hasSubscription = Boolean(subscription?.stripeCustomerId);
  const plans = plansData?.plans ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.description")}</p>
        </div>
        {status && (
          <Badge variant={status === "active" ? "default" : "secondary"} className="h-fit">
            {t(`billing.status.${status}`)}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
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
