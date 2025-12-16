import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetTenantStats,
  useGetOnboarding,
  useGetTenantActivity,
} from "@/services/tenants";
import { useGetVisitorStats } from "@/services/analytics";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VisitorStatsCards } from "@/components/dashboard/visitor-stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";

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

  const { data: statsData, isLoading: isLoadingStats } = useGetTenantStats(
    tenant.id
  );
  const { data: onboardingData } = useGetOnboarding(tenant.id);
  const { data: activityData, isLoading: isLoadingActivity } =
    useGetTenantActivity(tenant.id, 5);
  const { data: visitorData, isLoading: isLoadingVisitors } =
    useGetVisitorStats(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("dashboard.home.welcome", { name: tenant.name })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.home.description")}
        </p>
      </div>

      {onboardingData?.steps && (
        <OnboardingChecklist
          tenantSlug={tenant.slug}
          steps={onboardingData.steps}
        />
      )}

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
