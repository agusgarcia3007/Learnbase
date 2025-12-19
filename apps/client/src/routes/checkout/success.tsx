import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createSeoMeta } from "@/lib/seo";
import { useSessionStatus } from "@/services/checkout";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { setResolvedSlug } from "@/lib/tenant";
import { Button } from "@learnbase/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, BookOpen, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || "",
  }),
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    return { slug: tenantInfo.slug };
  },
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
  const { slug } = Route.useLoaderData();

  useEffect(() => {
    if (slug) {
      setResolvedSlug(slug);
    }
  }, [slug]);

  const { data, isLoading, isError } = useSessionStatus(session_id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">{t("checkout.verifying")}</p>
        </div>
      </div>
    );
  }

  const isSuccess = data?.paymentStatus === "paid";

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
            <Link to="/courses" search={{ campus: undefined }}>
              <Button>{t("checkout.backToCourses")}</Button>
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
              <Button variant="outline">
                {t("checkout.success.continueShopping")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
