import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { useEnrollmentStatus } from "@/services/checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookOpen, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/$tenantSlug/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || "",
  }),
  head: () =>
    createSeoMeta({
      title: "Payment Successful",
      description: "Your payment has been processed successfully",
      noindex: true,
    }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const { t } = useTranslation();
  const { session_id } = Route.useSearch();
  const { tenant } = Route.useRouteContext();
  const { data, isLoading, isError } = useEnrollmentStatus(session_id);

  const isPending = data?.status === "pending";

  if (isLoading || isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            {isPending ? t("checkout.processing") : t("checkout.verifying")}
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = data?.status === "completed";

  if (isError || !isSuccess) {
    return (
      <div className="container mx-auto max-w-lg py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-8 text-destructive" />
            </div>
            <CardTitle>{t("checkout.error.title")}</CardTitle>
            <CardDescription>{t("checkout.error.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Link to="/$tenantSlug" params={{ tenantSlug: tenant.slug }}>
              <Button>{t("checkout.backToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          <CardTitle>{t("checkout.success.title")}</CardTitle>
          <CardDescription>{t("checkout.success.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("checkout.success.emailConfirmation")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/my-courses">
              <Button className="gap-2">
                <BookOpen className="size-4" />
                {t("checkout.success.goToCourses")}
              </Button>
            </Link>
            <Link to="/courses" search={{ campus: undefined }}>
              <Button variant="outline">{t("checkout.success.continueShopping")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
