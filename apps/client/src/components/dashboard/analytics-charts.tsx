import { useTranslation } from "react-i18next";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@learnbase/ui";
import type { TenantTrendsData } from "@/services/tenants";

type AnalyticsChartsProps = {
  trends: TenantTrendsData | undefined;
  isLoading: boolean;
};

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--chart-1))",
  },
  completions: {
    label: "Completions",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function AnalyticsChart({
  title,
  data,
  dataKey,
  color,
  isLoading,
  emptyMessage,
}: {
  title: string;
  data: { date: string; count: number }[];
  dataKey: string;
  color: string;
  isLoading: boolean;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {formattedData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={formattedData} margin={{ left: 0, right: 0 }}>
              <defs>
                <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                width={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    indicator="line"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                fill={`url(#fill-${dataKey})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ trends, isLoading }: AnalyticsChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AnalyticsChart
        title={t("dashboard.home.analytics.enrollmentTrends")}
        data={trends?.enrollmentGrowth ?? []}
        dataKey="enrollments"
        color="hsl(var(--chart-1))"
        isLoading={isLoading}
        emptyMessage={t("dashboard.home.analytics.noData")}
      />
      <AnalyticsChart
        title={t("dashboard.home.analytics.completionTrends")}
        data={trends?.completionGrowth ?? []}
        dataKey="completions"
        color="hsl(var(--chart-2))"
        isLoading={isLoading}
        emptyMessage={t("dashboard.home.analytics.noData")}
      />
    </div>
  );
}
