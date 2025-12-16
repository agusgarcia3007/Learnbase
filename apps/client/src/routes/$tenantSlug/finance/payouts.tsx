import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import {
  usePayoutStatus,
  useStartOnboarding,
  useRefreshOnboarding,
  useGetDashboardLink,
} from "@/services/payouts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  XCircle,
  Landmark,
  Banknote,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$tenantSlug/finance/payouts")({
  head: () =>
    createSeoMeta({
      title: "Payouts",
      description: "Set up Stripe Connect to receive payments",
      noindex: true,
    }),
  component: PayoutsPage,
});

function StatusBadge({ status }: { status: string | undefined }) {
  const { t } = useTranslation();

  switch (status) {
    case "active":
      return (
        <Badge className="gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-sm dark:text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {t("payouts.status.active")}
        </Badge>
      );
    case "pending":
      return (
        <Badge className="gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Clock className="size-3" />
          {t("payouts.status.pending")}
        </Badge>
      );
    case "restricted":
      return (
        <Badge className="gap-1.5 border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
          <XCircle className="size-3" />
          {t("payouts.status.restricted")}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-muted-foreground/50" />
          {t("payouts.status.notStarted")}
        </Badge>
      );
  }
}

function CapabilityCard({
  enabled,
  title,
  enabledText,
  disabledText,
  icon: Icon,
}: {
  enabled: boolean;
  title: string;
  enabledText: string;
  disabledText: string;
  icon: typeof Banknote;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${enabled ? "from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100" : "from-muted/20 to-transparent opacity-50"}`}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={`flex size-14 items-center justify-center rounded-2xl transition-all duration-300 ${enabled ? "bg-emerald-500/10 ring-1 ring-emerald-500/20 group-hover:ring-emerald-500/40" : "bg-muted ring-1 ring-border"}`}
        >
          {enabled ? (
            <Icon className="size-7 text-emerald-500" />
          ) : (
            <Icon className="size-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            {enabled ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {enabledText}
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {disabledText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PayoutsPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = usePayoutStatus();
  const { mutate: startOnboarding, isPending: isStarting } =
    useStartOnboarding();
  const { mutate: refreshOnboarding, isPending: isRefreshing } =
    useRefreshOnboarding();
  const { mutate: getDashboardLink, isPending: isGettingDashboard } =
    useGetDashboardLink();

  const handleStartOnboarding = () => {
    startOnboarding(undefined, {
      onSuccess: (data) => {
        window.location.href = data.onboardingUrl;
      },
    });
  };

  const handleRefreshOnboarding = () => {
    refreshOnboarding(undefined, {
      onSuccess: (data) => {
        window.location.href = data.onboardingUrl;
      },
    });
  };

  const handleOpenDashboard = () => {
    getDashboardLink(undefined, {
      onSuccess: (data) => {
        window.open(data.dashboardUrl, "_blank");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-8 md:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card to-card/80 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto size-24 rounded-full" />
            <Skeleton className="mx-auto mt-8 h-8 w-64" />
            <Skeleton className="mx-auto mt-4 h-4 w-80" />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
            <Skeleton className="mx-auto mt-10 h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Landmark className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("payouts.title")}
                </h1>
                <p className="text-muted-foreground">
                  {t("payouts.description")}
                </p>
              </div>
            </div>
          </div>
          <StatusBadge status={status?.status} />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card to-card/80 shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {status?.status === "not_started" && (
          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="relative mx-auto mb-8 inline-flex">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                  <Landmark className="size-12 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {t("payouts.setup.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                {t("payouts.setup.description")}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Zap, label: t("payouts.features.instant") },
                  { icon: ShieldCheck, label: t("payouts.features.secure") },
                  { icon: Banknote, label: t("payouts.features.payouts") },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                  >
                    <feature.icon className="size-4 text-primary" />
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleStartOnboarding}
                isLoading={isStarting}
                size="lg"
                className="group relative mt-10 overflow-hidden bg-gradient-to-r from-primary to-primary/90 px-8 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
              >
                <span className="relative flex items-center gap-2">
                  {t("payouts.setup.button")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>
          </div>
        )}

        {status?.status === "pending" && (
          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                    <Clock className="size-6 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("payouts.pending.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("payouts.pending.description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <Button
                  onClick={handleRefreshOnboarding}
                  isLoading={isRefreshing}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                >
                  <ExternalLink className="size-4" />
                  {t("payouts.pending.button")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {status?.status === "restricted" && (
          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                    <AlertTriangle className="size-6 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("payouts.restricted.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("payouts.restricted.description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <Button
                  onClick={handleRefreshOnboarding}
                  isLoading={isRefreshing}
                  size="lg"
                  variant="destructive"
                  className="gap-2 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
                >
                  <ExternalLink className="size-4" />
                  {t("payouts.restricted.button")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {status?.status === "active" && (
          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <div className="relative mx-auto mb-6 inline-flex">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />
                  <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="size-10 text-emerald-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {t("payouts.active.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("payouts.active.description")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CapabilityCard
                  enabled={status.chargesEnabled}
                  title={t("payouts.active.charges")}
                  enabledText={t("payouts.active.enabled")}
                  disabledText={t("payouts.active.disabled")}
                  icon={Banknote}
                />
                <CapabilityCard
                  enabled={status.payoutsEnabled}
                  title={t("payouts.active.payouts")}
                  enabledText={t("payouts.active.enabled")}
                  disabledText={t("payouts.active.disabled")}
                  icon={Landmark}
                />
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleOpenDashboard}
                  isLoading={isGettingDashboard}
                  size="lg"
                  variant="outline"
                  className="group gap-2 border-border/60 px-8 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
                >
                  <ExternalLink className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  {t("payouts.active.dashboard")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
