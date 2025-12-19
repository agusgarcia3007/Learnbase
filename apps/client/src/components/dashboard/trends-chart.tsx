import { useTranslation } from "react-i18next";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@learnbase/ui";
import type { TenantTrendsData } from "@/services/tenants";

type TrendsChartProps = {
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

function mergeData(
  enrollments: { date: string; count: number }[],
  completions: { date: string; count: number }[]
) {
  const dateMap = new Map<string, { enrollments: number; completions: number }>();

  enrollments.forEach((item) => {
    dateMap.set(item.date, { enrollments: item.count, completions: 0 });
  });

  completions.forEach((item) => {
    const existing = dateMap.get(item.date);
    if (existing) {
      existing.completions = item.count;
    } else {
      dateMap.set(item.date, { enrollments: 0, completions: item.count });
    }
  });

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      formattedDate: formatDate(date),
      ...data,
    }));
}

export function TrendsChart({ trends, isLoading }: TrendsChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {t("dashboard.trends.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const data = mergeData(
    trends?.enrollmentGrowth ?? [],
    trends?.completionGrowth ?? []
  );

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("dashboard.trends.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            {t("dashboard.trends.noData")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 10 }}>
              <defs>
                <linearGradient id="fillEnrollments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillCompletions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                width={30}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    indicator="line"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="enrollments"
                stroke="hsl(var(--chart-1))"
                fill="url(#fillEnrollments)"
                strokeWidth={2}
                name={t("dashboard.trends.enrollments")}
              />
              <Area
                type="monotone"
                dataKey="completions"
                stroke="hsl(var(--chart-2))"
                fill="url(#fillCompletions)"
                strokeWidth={2}
                name={t("dashboard.trends.completions")}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
