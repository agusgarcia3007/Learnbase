import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";
import type { TenantTrendPeriod } from "@/services/tenants";
import { cn } from "@/lib/utils";

type PeriodSelectorProps = {
  value: TenantTrendPeriod;
  onChange: (period: TenantTrendPeriod) => void;
};

const periods: TenantTrendPeriod[] = ["7d", "30d", "90d"];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
      {periods.map((period) => (
        <Button
          key={period}
          variant="ghost"
          size="sm"
          onClick={() => onChange(period)}
          className={cn(
            "h-7 px-3 text-xs",
            value === period && "bg-background shadow-sm"
          )}
        >
          {t(`dashboard.home.period.${period}`)}
        </Button>
      ))}
    </div>
  );
}
