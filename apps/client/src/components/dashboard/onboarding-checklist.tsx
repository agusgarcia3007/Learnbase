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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingSteps } from "@/services/tenants/service";

type OnboardingChecklistProps = {
  tenantSlug: string;
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

export function OnboardingChecklist({
  tenantSlug,
  steps,
}: OnboardingChecklistProps) {
  const { t } = useTranslation();

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = stepConfig.length;
  const progress = (completedCount / totalSteps) * 100;
  const allCompleted = completedCount === totalSteps;

  if (allCompleted) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{t("dashboard.onboarding.title")}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {t("dashboard.onboarding.progress", {
              completed: completedCount,
              total: totalSteps,
            })}
          </span>
        </div>
        <CardDescription className="sr-only">
          {t("dashboard.onboarding.title")}
        </CardDescription>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="grid gap-2">
        {stepConfig.map(({ key, icon: Icon, href }) => {
          const isCompleted = steps[key];
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                isCompleted && "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Check className="size-4 text-primary" />
                  </div>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full border">
                    <Circle className="size-4 text-muted-foreground" />
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
                <Button variant="ghost" size="sm" asChild>
                  <Link to={href(tenantSlug)}>
                    <Icon className="mr-2 size-4" />
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
