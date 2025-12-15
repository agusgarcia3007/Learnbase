import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { useConnectStatus, useStartOnboarding, useRefreshOnboarding, useGetDashboardLink } from "@/services/connect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2, XCircle, Landmark } from "lucide-react";

export const Route = createFileRoute("/$tenantSlug/connect")({
  head: () =>
    createSeoMeta({
      title: "Payments",
      description: "Set up payments for your courses",
      noindex: true,
    }),
  component: ConnectPage,
});

function ConnectPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useConnectStatus();
  const { mutate: startOnboarding, isPending: isStarting } = useStartOnboarding();
  const { mutate: refreshOnboarding, isPending: isRefreshing } = useRefreshOnboarding();
  const { mutate: getDashboardLink, isPending: isGettingDashboard } = useGetDashboardLink();

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (status?.status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="size-3" />
            {t("connect.status.active")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {t("connect.status.pending")}
          </Badge>
        );
      case "restricted":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            {t("connect.status.restricted")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            {t("connect.status.notStarted")}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("connect.title")}</h1>
        <p className="text-muted-foreground">{t("connect.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Landmark className="size-5" />
              {t("connect.accountTitle")}
            </span>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {t("connect.accountDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.status === "not_started" && (
            <>
              <Alert>
                <AlertCircle className="size-4" />
                <AlertTitle>{t("connect.setup.title")}</AlertTitle>
                <AlertDescription>
                  {t("connect.setup.description")}
                </AlertDescription>
              </Alert>
              <Button onClick={handleStartOnboarding} isLoading={isStarting} className="gap-2">
                <ExternalLink className="size-4" />
                {t("connect.setup.button")}
              </Button>
            </>
          )}

          {status?.status === "pending" && (
            <>
              <Alert variant="warning">
                <Clock className="size-4" />
                <AlertTitle>{t("connect.pending.title")}</AlertTitle>
                <AlertDescription>
                  {t("connect.pending.description")}
                </AlertDescription>
              </Alert>
              <Button onClick={handleRefreshOnboarding} isLoading={isRefreshing} className="gap-2">
                <ExternalLink className="size-4" />
                {t("connect.pending.button")}
              </Button>
            </>
          )}

          {status?.status === "restricted" && (
            <>
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>{t("connect.restricted.title")}</AlertTitle>
                <AlertDescription>
                  {t("connect.restricted.description")}
                </AlertDescription>
              </Alert>
              <Button onClick={handleRefreshOnboarding} isLoading={isRefreshing} className="gap-2">
                <ExternalLink className="size-4" />
                {t("connect.restricted.button")}
              </Button>
            </>
          )}

          {status?.status === "active" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className={`flex size-10 items-center justify-center rounded-full ${status.chargesEnabled ? "bg-green-500/10" : "bg-muted"}`}>
                    {status.chargesEnabled ? (
                      <CheckCircle2 className="size-5 text-green-500" />
                    ) : (
                      <XCircle className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t("connect.active.charges")}</p>
                    <p className="text-sm text-muted-foreground">
                      {status.chargesEnabled ? t("connect.active.enabled") : t("connect.active.disabled")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className={`flex size-10 items-center justify-center rounded-full ${status.payoutsEnabled ? "bg-green-500/10" : "bg-muted"}`}>
                    {status.payoutsEnabled ? (
                      <CheckCircle2 className="size-5 text-green-500" />
                    ) : (
                      <XCircle className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t("connect.active.payouts")}</p>
                    <p className="text-sm text-muted-foreground">
                      {status.payoutsEnabled ? t("connect.active.enabled") : t("connect.active.disabled")}
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenDashboard} isLoading={isGettingDashboard} variant="outline" className="gap-2">
                <ExternalLink className="size-4" />
                {t("connect.active.dashboard")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
