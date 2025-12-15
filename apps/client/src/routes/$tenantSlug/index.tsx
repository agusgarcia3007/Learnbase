import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getCampusUrl } from "@/lib/tenant";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetTenantStats,
  useGetOnboarding,
  useGetTenantTrends,
  useGetTenantTopCourses,
  useGetTenantActivity,
  type TenantTrendPeriod,
} from "@/services/tenants";
import { useGetVisitorStats } from "@/services/analytics";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VisitorStatsCards } from "@/components/dashboard/visitor-stats";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { TopCoursesTable } from "@/components/dashboard/top-courses-table";
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
  const campusUrl = getCampusUrl(tenant.slug, tenant.customDomain);
  const [period, setPeriod] = useState<TenantTrendPeriod>("30d");

  const { data: statsData, isLoading: isLoadingStats } = useGetTenantStats(
    tenant.id
  );
  const { data: onboardingData } = useGetOnboarding(tenant.id);
  const { data: trendsData, isLoading: isLoadingTrends } = useGetTenantTrends(
    tenant.id,
    period
  );
  const { data: topCoursesData, isLoading: isLoadingTopCourses } =
    useGetTenantTopCourses(tenant.id, 5);
  const { data: activityData, isLoading: isLoadingActivity } =
    useGetTenantActivity(tenant.id, 5);
  const { data: visitorData, isLoading: isLoadingVisitors } =
    useGetVisitorStats(tenant.id, period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.home.welcome", { name: tenant.name })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.home.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <a href={campusUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="size-4" />
              {t("dashboard.home.viewCampus")}
            </Button>
          </a>
        </div>
      </div>

      {onboardingData?.steps && (
        <OnboardingChecklist
          tenantSlug={tenant.slug}
          steps={onboardingData.steps}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatsCards stats={statsData?.stats} isLoading={isLoadingStats} />
        </div>
        <VisitorStatsCards
          stats={visitorData?.visitors}
          isLoading={isLoadingVisitors}
        />
      </div>

      <TrendsChart trends={trendsData?.trends} isLoading={isLoadingTrends} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopCoursesTable
          courses={topCoursesData?.courses}
          isLoading={isLoadingTopCourses}
        />
        <RecentActivity
          activities={activityData?.activities}
          isLoading={isLoadingActivity}
        />
      </div>
    </div>
  );
}
