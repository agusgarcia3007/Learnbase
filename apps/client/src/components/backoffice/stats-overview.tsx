import { useTranslation } from "react-i18next";
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Percent,
} from "lucide-react";
import { Skeleton } from "@learnbase/ui";
import type { DashboardStats } from "@/services/dashboard";
import { cn } from "@/lib/utils";

type StatsOverviewProps = {
  stats: DashboardStats | undefined;
  isLoading: boolean;
};

function GrowthIndicator({ value }: { value: number }) {
  const { t } = useTranslation();
  const isPositive = value >= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tracking-wide",
        isPositive ? "text-emerald-600" : "text-rose-500"
      )}
    >
      {isPositive ? (
        <TrendingUp className="size-3" strokeWidth={2.5} />
      ) : (
        <TrendingDown className="size-3" strokeWidth={2.5} />
      )}
      {isPositive ? "+" : ""}
      {value}%
      <span className="text-muted-foreground/60 font-normal ml-0.5">
        {t("backoffice.dashboard.vsLastPeriod")}
      </span>
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  growth,
  isLoading,
  format = "number",
  accent = "default",
}: {
  title: string;
  value: number | undefined;
  icon: typeof Users;
  growth?: number;
  isLoading: boolean;
  format?: "number" | "currency" | "percent";
  accent?: "default" | "primary" | "success" | "warning";
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percent":
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const accentColors = {
    default: "bg-muted/40",
    primary: "bg-primary/5",
    success: "bg-emerald-500/5",
    warning: "bg-amber-500/5",
  };

  const iconColors = {
    default: "text-muted-foreground/50",
    primary: "text-primary/40",
    success: "text-emerald-500/40",
    warning: "text-amber-500/40",
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl p-5 transition-all duration-300",
        accentColors[accent],
        "hover:shadow-sm hover:shadow-black/[0.03]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-muted-foreground tracking-tight">
            {title}
          </p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {value !== undefined ? formatValue(value) : "—"}
              </p>
              {growth !== undefined && <GrowthIndicator value={growth} />}
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-2.5 transition-transform duration-300 group-hover:scale-110",
            iconColors[accent]
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("backoffice.dashboard.totalUsers")}
          value={stats?.overview.totalUsers}
          icon={Users}
          growth={stats?.growth.usersChange}
          isLoading={isLoading}
          accent="primary"
        />
        <StatCard
          title={t("backoffice.dashboard.totalTenants")}
          value={stats?.overview.totalTenants}
          icon={Building2}
          growth={stats?.growth.tenantsChange}
          isLoading={isLoading}
        />
        <StatCard
          title={t("backoffice.dashboard.totalCourses")}
          value={stats?.overview.totalCourses}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatCard
          title={t("backoffice.dashboard.totalProcessed")}
          value={stats?.revenue.totalProcessed}
          icon={DollarSign}
          isLoading={isLoading}
          format="currency"
          accent="success"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("backoffice.dashboard.platformFees")}
          value={stats?.revenue.platformFeeRevenue}
          icon={Percent}
          isLoading={isLoading}
          format="currency"
          accent="warning"
        />
        <StatCard
          title={t("backoffice.dashboard.totalEnrollments")}
          value={stats?.overview.totalEnrollments}
          icon={GraduationCap}
          growth={stats?.growth.enrollmentsChange}
          isLoading={isLoading}
        />
        <StatCard
          title={t("backoffice.dashboard.activeUsers")}
          value={stats?.overview.activeUsers30d}
          icon={Activity}
          isLoading={isLoading}
          accent="warning"
        />
        <StatCard
          title={t("backoffice.dashboard.completionRate")}
          value={stats?.engagement.avgCompletionRate}
          icon={TrendingUp}
          isLoading={isLoading}
          format="percent"
        />
        <StatCard
          title={t("backoffice.dashboard.certificates")}
          value={stats?.overview.totalCertificates}
          icon={Award}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
