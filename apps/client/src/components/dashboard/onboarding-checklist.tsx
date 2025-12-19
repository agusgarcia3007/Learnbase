import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@learnbase/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { OnboardingSteps } from "@/services/tenants/service";

type OnboardingChecklistProps = {
  tenantSlug: string;
  steps: OnboardingSteps;
  manualSteps: OnboardingSteps;
  onToggleStep: (key: keyof OnboardingSteps) => void;
};

const stepConfig = [
  {
    key: "basicInfo" as const,
    href: (slug: string) => `/${slug}/site/configuration`,
  },
  {
    key: "category" as const,
    href: (slug: string) => `/${slug}/content/categories`,
  },
  {
    key: "instructor" as const,
    href: (slug: string) => `/${slug}/content/instructors`,
  },
  {
    key: "module" as const,
    href: (slug: string) => `/${slug}/content/modules`,
  },
  {
    key: "course" as const,
    href: (slug: string) => `/${slug}/content/courses`,
  },
];

export function OnboardingChecklist({
  tenantSlug,
  steps,
  manualSteps,
  onToggleStep,
}: OnboardingChecklistProps) {
  const { t } = useTranslation();

  const allCompleted = stepConfig.every(
    ({ key }) => steps[key] || manualSteps[key]
  );

  if (allCompleted) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("dashboard.onboarding.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {stepConfig.map(({ key, href }) => {
          const isAutoCompleted = steps[key];
          const isManualCompleted = manualSteps[key];
          const isCompleted = isAutoCompleted || isManualCompleted;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50",
                isCompleted && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isCompleted}
                  disabled={isAutoCompleted}
                  onCheckedChange={() => !isAutoCompleted && onToggleStep(key)}
                  className="size-5 shrink-0"
                />
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-muted-foreground line-through"
                    )}
                  >
                    {t(`dashboard.onboarding.steps.${key}.title`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`dashboard.onboarding.steps.${key}.description`)}
                  </p>
                </div>
              </div>
              {!isCompleted && (
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link to={href(tenantSlug)}>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
