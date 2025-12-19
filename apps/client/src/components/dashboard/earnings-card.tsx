import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import type { EarningsResponse } from "@/services/revenue/service";

type EarningsCardProps = {
  earnings: EarningsResponse | undefined;
  isLoading: boolean;
};

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function EarningsCard({ earnings, isLoading }: EarningsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("revenue.earnings.gross")}
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(earnings?.grossEarnings ?? 0)}
                </p>
              )}
              {isLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {earnings?.transactionCount ?? 0} {t("revenue.earnings.transactions")}
                </p>
              )}
            </div>
            <div className="rounded-lg p-2.5 bg-green-500/10 text-green-500">
              <DollarSign className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("revenue.earnings.net")}
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-green-600">
                  {formatCurrency(earnings?.netEarnings ?? 0)}
                </p>
              )}
              {isLoading ? (
                <Skeleton className="h-3 w-28" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("revenue.earnings.afterFees")}
                </p>
              )}
            </div>
            <div className="rounded-lg p-2.5 bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
