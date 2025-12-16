import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ListChecks } from "lucide-react";
import { createSeoMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  useGetTenantStats,
  useGetTenantActivity,
} from "@/services/tenants";
import { useGetVisitorStats } from "@/services/analytics";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VisitorStatsCards } from "@/components/dashboard/visitor-stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useOnboardingPanel } from "./route";

export const Route = createFileRoute("/$tenantSlug/")({
  head: () =>
    createSeoMeta({
      title: "Dashboard",
      description: "Manage your academy",
      noindex: true,
    }),
  component: DashboardHome,
});

function DashboardHome() {
  const { t } = useTranslation();
  const { tenant } = Route.useRouteContext();
  const { toggle, isOpen, steps } = useOnboardingPanel();

  const { data: statsData, isLoading: isLoadingStats } = useGetTenantStats(
    tenant.id
  );
  const { data: activityData, isLoading: isLoadingActivity } =
    useGetTenantActivity(tenant.id, 5);
  const { data: visitorData, isLoading: isLoadingVisitors } =
    useGetVisitorStats(tenant.id);
  const allStepsCompleted = steps && Object.values(steps).every(Boolean);
  const showOnboardingButton = steps && !allStepsCompleted;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.home.welcome", { name: tenant.name })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.home.description")}
          </p>
        </div>
        {showOnboardingButton && (
          <Button
            variant={isOpen ? "secondary" : "outline"}
            onClick={toggle}
            className="shrink-0"
          >
            <ListChecks className="mr-2 size-4" />
            {t("dashboard.onboarding.openPanel")}
          </Button>
        )}
      </div>

      <StatsCards stats={statsData?.stats} isLoading={isLoadingStats} />

      <VisitorStatsCards
        stats={visitorData?.visitors}
        isLoading={isLoadingVisitors}
      />

      <RecentActivity
        activities={activityData?.activities}
        isLoading={isLoadingActivity}
      />
    </div>
  );
}
