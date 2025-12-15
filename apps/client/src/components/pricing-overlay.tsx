import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { PlanInfo, TenantPlan } from "@/services/billing/service";

type PricingOverlayProps = {
  plans: PlanInfo[];
  onSelectPlan: (plan: TenantPlan) => void;
  isLoading: boolean;
  canClose?: boolean;
  onClose?: () => void;
};

function PlanFeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="text-primary size-3" strokeWidth={3.5} />
      {children}
    </li>
  );
}

function PricingCard({
  plan,
  isRecommended,
  onSelect,
  isLoading,
  t,
}: {
  plan: PlanInfo;
  isRecommended: boolean;
  onSelect: () => void;
  isLoading: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const features = [
    plan.maxStudents
      ? t("billing.features.maxStudents", { count: plan.maxStudents })
      : t("billing.features.unlimitedStudents"),
    plan.maxCourses
      ? t("billing.features.maxCourses", { count: plan.maxCourses })
      : t("billing.features.unlimitedCourses"),
    t("billing.features.storage", { size: plan.storageGb }),
    t("billing.features.ai", {
      type: t(`billing.aiTypes.${plan.aiGeneration}`),
    }),
    t("billing.features.commission", { rate: plan.commissionRate }),
  ];

  if (plan.certificates) features.push(t("billing.features.certificates"));
  if (plan.customDomain) features.push(t("billing.features.customDomain"));
  if (plan.analytics) features.push(t("billing.features.analytics"));
  if (plan.prioritySupport)
    features.push(t("billing.features.prioritySupport"));
  if (plan.whiteLabel) features.push(t("billing.features.whiteLabel"));

  return (
    <div
      className={cn(
        "flex flex-col",
        isRecommended &&
          "ring-foreground/10 bg-background rounded-xl border-transparent shadow ring-1 lg:-my-3"
      )}
    >
      <div className={cn("p-8", isRecommended && "lg:py-3 lg:px-0")}>
        <div className="p-0 lg:p-8">
          <h3 className="font-medium">{t(`billing.plans.${plan.id}`)}</h3>
          <span className="mb-0.5 mt-2 block text-2xl font-semibold">
            {formatPrice(plan.monthlyPrice, "USD")}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {t("billing.perMonth")}
            </span>
          </span>
        </div>

        <div
          className={cn(
            "border-y px-0 py-4 lg:px-8",
            isRecommended && "lg:mx-0"
          )}
        >
          <Button
            className="w-full"
            variant={isRecommended ? "primary" : "secondary"}
            onClick={onSelect}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t("billing.selectPlan")
            )}
          </Button>
        </div>

        <ul role="list" className="space-y-3 p-0 pt-6 lg:p-8">
          {features.map((feature, index) => (
            <PlanFeatureItem key={index}>{feature}</PlanFeatureItem>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingOverlay({
  plans,
  onSelectPlan,
  isLoading,
  canClose,
  onClose,
}: PricingOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm">
      {canClose && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 top-4 z-50"
          onClick={onClose}
        >
          <X className="size-5" />
        </Button>
      )}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            {canClose
              ? t("billing.changePlan")
              : t("billing.noPlanDescription")}
          </Badge>
          <h2 className="text-balance text-3xl font-bold md:text-4xl">
            {t("billing.overlay.title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
            {t("billing.overlay.description")}
          </p>
        </div>

        <div className="relative mt-12">
          <Card className="relative mx-auto max-w-sm lg:max-w-full">
            <div className="grid lg:grid-cols-3">
              {plans.map((plan) => {
                const isRecommended = plan.id === "growth";
                return (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    isRecommended={isRecommended}
                    onSelect={() => onSelectPlan(plan.id as TenantPlan)}
                    isLoading={isLoading}
                    t={t}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
