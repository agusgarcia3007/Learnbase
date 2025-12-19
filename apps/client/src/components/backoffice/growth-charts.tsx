import { useTranslation } from "react-i18next";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@learnbase/ui";
import type { TrendsData } from "@/services/dashboard";
import { cn } from "@/lib/utils";

type GrowthChartsProps = {
  trends: TrendsData | undefined;
  isLoading: boolean;
};

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--chart-1))",
  },
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--chart-2))",
  },
  certificates: {
    label: "Certificates",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChartSection({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function GrowthChart({
  title,
  subtitle,
  data,
  dataKey,
  color,
  isLoading,
}: {
  title: string;
  subtitle?: string;
  data: { date: string; count: number }[];
  dataKey: string;
  color: string;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <ChartSection title={title} subtitle={subtitle}>
        <Skeleton className="h-[220px] w-full rounded-xl" />
      </ChartSection>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const totalValue = data.reduce((sum, item) => sum + item.count, 0);
  const avgValue = data.length > 0 ? Math.round(totalValue / data.length) : 0;

  return (
    <ChartSection title={title} subtitle={subtitle}>
      {formattedData.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {t("common.noDataAvailable")}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-0 top-0 flex items-baseline gap-1.5 text-right">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {avgValue.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">avg/day</span>
          </div>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart
              data={formattedData}
              margin={{ left: -20, right: 0, top: 40, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`gradient-${dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={40}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={45}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    indicator="line"
                    className="rounded-lg border-none bg-background/95 shadow-lg backdrop-blur-sm"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                fill={`url(#gradient-${dataKey})`}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                  fill: color,
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </ChartSection>
  );
}

export function GrowthCharts({ trends, isLoading }: GrowthChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl bg-muted/20 p-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <GrowthChart
          title={t("backoffice.dashboard.userGrowth")}
          subtitle={t("backoffice.dashboard.newUsersOverTime")}
          data={trends?.userGrowth ?? []}
          dataKey="users"
          color="hsl(var(--chart-1))"
          isLoading={isLoading}
        />
        <GrowthChart
          title={t("backoffice.dashboard.enrollmentGrowth")}
          subtitle={t("backoffice.dashboard.enrollmentsOverTime")}
          data={trends?.enrollmentGrowth ?? []}
          dataKey="enrollments"
          color="hsl(var(--chart-2))"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
