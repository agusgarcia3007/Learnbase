import { useTranslation } from "react-i18next";
import { Users, GraduationCap, TrendingUp, Award, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TenantStats } from "@/services/tenants";

type StatsCardsProps = {
  stats: TenantStats | undefined;
  isLoading: boolean;
};

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  isLoading: boolean;
};

function StatCard({ title, value, subtitle, icon: Icon, iconColor, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
            )}
            {isLoading ? (
              <Skeleton className="h-3 w-24" />
            ) : (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${iconColor}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("dashboard.stats.students")}
        value={stats?.totalStudents ?? 0}
        subtitle={t("dashboard.stats.newStudents", { count: stats?.newStudents30d ?? 0 })}
        icon={Users}
        iconColor="bg-blue-500/10 text-blue-500"
        isLoading={isLoading}
      />
      <StatCard
        title={t("dashboard.stats.enrollments")}
        value={stats?.activeEnrollments ?? 0}
        subtitle={t("dashboard.stats.totalEnrollments", { count: stats?.totalEnrollments ?? 0 })}
        icon={GraduationCap}
        iconColor="bg-emerald-500/10 text-emerald-500"
        isLoading={isLoading}
      />
      <StatCard
        title={t("dashboard.stats.completionRate")}
        value={`${stats?.completionRate ?? 0}%`}
        subtitle={t("dashboard.stats.completed", { count: stats?.completedEnrollments ?? 0 })}
        icon={TrendingUp}
        iconColor="bg-violet-500/10 text-violet-500"
        isLoading={isLoading}
      />
      <StatCard
        title={t("dashboard.stats.certificates")}
        value={stats?.totalCertificates ?? 0}
        subtitle={t("dashboard.stats.coursesPublished", { count: stats?.totalCourses ?? 0 })}
        icon={Award}
        iconColor="bg-amber-500/10 text-amber-500"
        isLoading={isLoading}
      />
    </div>
  );
}
