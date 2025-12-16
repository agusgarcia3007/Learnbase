import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Settings,
  FolderTree,
  UserCircle,
  Layers,
  BookOpen,
  Check,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingSteps, Tenant } from "@/services/tenants/service";

type OnboardingPanelProps = {
  tenant: Tenant;
  steps: OnboardingSteps;
};

const stepConfig = [
  {
    key: "basicInfo" as const,
    icon: Settings,
    href: (slug: string) => `/${slug}/site/configuration`,
  },
  {
    key: "category" as const,
    icon: FolderTree,
    href: (slug: string) => `/${slug}/content/categories`,
  },
  {
    key: "instructor" as const,
    icon: UserCircle,
    href: (slug: string) => `/${slug}/content/instructors`,
  },
  {
    key: "module" as const,
    icon: Layers,
    href: (slug: string) => `/${slug}/content/modules`,
  },
  {
    key: "course" as const,
    icon: BookOpen,
    href: (slug: string) => `/${slug}/content/courses`,
  },
];

export function OnboardingPanel({
  tenant,
  steps,
}: OnboardingPanelProps) {
  const { t } = useTranslation();

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = stepConfig.length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l bg-background shadow-lg">
      <div className="border-b p-4">
        <h2 className="text-base font-semibold">{t("dashboard.onboarding.title")}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("dashboard.onboarding.progress", { completed: completedCount, total: totalSteps })}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </div>

        <div className="space-y-1 px-2">
          {stepConfig.map(({ key, icon: Icon, href }) => {
            const isCompleted = steps[key];
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50",
                  isCompleted && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </div>
                  ) : (
                    <div className="flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                      <Circle className="size-2 text-muted-foreground/50" />
                    </div>
                  )}
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
                    <Link to={href(tenant.slug)}>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
