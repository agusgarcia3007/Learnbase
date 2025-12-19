import { Button } from "@learnbase/ui";
import { Card, CardContent } from "@learnbase/ui";
import { createSeoMeta } from "@/lib/seo";
import { useVerifyEmail } from "@/services/auth/mutations";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/__auth/verify-email")({
  head: () =>
    createSeoMeta({
      title: "Verify Email",
      description: "Verify your email address",
      noindex: true,
    }),
  component: VerifyEmailPage,
  validateSearch: searchSchema,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const { mutate: verifyEmail, isPending, isSuccess, isError } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  if (!token) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.emailVerification.errorTitle")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent className="flex flex-col items-center gap-4">
            <XCircle className="size-12 text-destructive" />
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.emailVerification.errorInvalid")}
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/90"
          >
            {t("common.signIn")}
          </Link>
        </p>
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.emailVerification.pageTitle")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.emailVerification.verifying")}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.emailVerification.successTitle")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent className="flex flex-col items-center gap-4">
            <CheckCircle className="size-12 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.emailVerification.successDescription")}
            </p>
            <Button asChild className="w-full">
              <Link to="/login">{t("auth.emailVerification.goToDashboard")}</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.emailVerification.errorTitle")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent className="flex flex-col items-center gap-4">
            <XCircle className="size-12 text-destructive" />
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.emailVerification.errorExpired")}
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/90"
          >
            {t("auth.emailVerification.requestNewLink")}
          </Link>
        </p>
      </>
    );
  }

  return null;
}
