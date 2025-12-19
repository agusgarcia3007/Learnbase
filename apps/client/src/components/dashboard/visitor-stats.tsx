import { useTranslation } from "react-i18next";
import { Eye, MousePointerClick, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import type { VisitorStats } from "@/services/analytics";

type VisitorStatsCardsProps = {
  stats: VisitorStats | undefined;
  isLoading: boolean;
};

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  isLoading: boolean;
};

function StatCard({ title, value, icon: Icon, iconColor, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconColor}`}>
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-12" />
            ) : (
              <p className="text-lg font-semibold">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisitorStatsCards({ stats, isLoading }: VisitorStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title={t("dashboard.visitors.uniqueVisitors")}
        value={stats?.total ?? 0}
        icon={Eye}
        iconColor="bg-sky-500/10 text-sky-500"
        isLoading={isLoading}
      />
      <StatCard
        title={t("dashboard.visitors.bounceRate")}
        value={`${stats?.bounceRate ?? 0}%`}
        icon={MousePointerClick}
        iconColor="bg-rose-500/10 text-rose-500"
        isLoading={isLoading}
      />
    </div>
  );
}
