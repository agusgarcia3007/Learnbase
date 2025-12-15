import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { useSubscription, usePlans, useCreateSubscription, useCreatePortalSession } from "@/services/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantPlan } from "@/services/billing/service";

export const Route = createFileRoute("/$tenantSlug/billing")({
  head: () =>
    createSeoMeta({
      title: "Billing",
      description: "Manage your subscription",
      noindex: true,
    }),
  component: BillingPage,
});

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
  const hasActiveSubscription = status === "active" || status === "trialing";
  const plans = plansData?.plans ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
        <p className="text-muted-foreground">{t("billing.description")}</p>
      </div>

      {hasActiveSubscription && subscription?.stripeCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("billing.currentPlan")}</span>
              {status && (
                <Badge variant={status === "active" ? "default" : "secondary"}>
                  {t(`billing.status.${status}`)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {currentPlan && t(`billing.plans.${currentPlan}`)} - {t("billing.commission", { rate: subscription.commissionRate })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleManageBilling} isLoading={isOpeningPortal} className="gap-2">
              <CreditCard className="size-4" />
              {t("billing.manageBilling")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isRecommended = plan.id === "growth";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                isRecommended && "border-primary shadow-md",
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
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(plan.monthlyPrice, "USD")}
                  </span>
                  <span className="text-muted-foreground">{t("billing.perMonth")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-green-500" />
                    {t("billing.features.storage", { size: plan.storage })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-green-500" />
                    {t("billing.features.ai", { type: plan.aiGeneration })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-green-500" />
                    {t("billing.commission", { rate: plan.commissionRate })}
                  </li>
                </ul>
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t("billing.currentPlan")}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isRecommended ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id as TenantPlan)}
                    isLoading={isCreating}
                  >
                    {t("billing.selectPlan")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
