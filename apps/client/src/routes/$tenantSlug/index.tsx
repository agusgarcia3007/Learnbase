import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { canViewFinance } from "@/lib/permissions";
import {
  useGetTenantStats,
  useGetTenantActivity,
} from "@/services/tenants";
import { useGetVisitorStats } from "@/services/analytics";
import { useEarnings } from "@/services/revenue";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EarningsCard } from "@/components/dashboard/earnings-card";
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
  const { tenant, user } = Route.useRouteContext();
  const showFinance = canViewFinance(user.role);

  const { data: statsData, isLoading: isLoadingStats } = useGetTenantStats(
    tenant.id
  );
  const { data: activityData, isLoading: isLoadingActivity } =
    useGetTenantActivity(tenant.id, 5);
  const { data: visitorData, isLoading: isLoadingVisitors } =
    useGetVisitorStats(tenant.id);
  const { data: earningsData, isLoading: isLoadingEarnings } = useEarnings({
    enabled: showFinance,
  });

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

      <StatsCards stats={statsData?.stats} isLoading={isLoadingStats} />

      {showFinance && (
        <EarningsCard earnings={earningsData} isLoading={isLoadingEarnings} />
      )}

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
