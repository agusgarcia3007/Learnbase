import { Button } from "@learnbase/ui";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/auth";
import { createSeoMeta } from "@/lib/seo";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getCampusTenantServer } from "@/services/campus/server";
import { useResetPassword } from "@/services/auth/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/__auth/reset-password")({
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    const tenant = tenantInfo.slug
      ? await getCampusTenantServer({ data: { slug: tenantInfo.slug } }).then(
          (r) => r?.tenant
        )
      : null;
    return { tenant };
  },
  head: ({ loaderData }) => {
    const tenantName = loaderData?.tenant?.name || "LearnBase";
    return createSeoMeta({
      title: "Reset Password",
      description: `Set a new password for your ${tenantName} account`,
      siteName: tenantName,
      noindex: true,
    });
  },
  component: ResetPasswordPage,
  validateSearch: searchSchema,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const { mutate: resetPassword, isPending, isSuccess } = useResetPassword();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(data: ResetPasswordInput) {
    if (!token) return;
    resetPassword({ token, password: data.password });
  }

  if (!token) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.resetPassword.invalidLink")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.resetPassword.invalidLinkDescription")}
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:text-primary/90"
          >
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </p>
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <h3 className="mt-2 text-center text-lg font-bold text-foreground">
          {t("auth.resetPassword.success")}
        </h3>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.resetPassword.successDescription")}
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

  return (
    <>
      <h3 className="mt-2 text-center text-lg font-bold text-foreground">
        {t("auth.resetPassword.title")}
      </h3>

      <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.resetPassword.newPassword")}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t(
                          "auth.resetPassword.newPasswordPlaceholder"
                        )}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("auth.resetPassword.confirmNewPassword")}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t(
                          "auth.resetPassword.confirmNewPasswordPlaceholder"
                        )}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" isLoading={isPending}>
                {t("auth.resetPassword.resetPassword")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.resetPassword.rememberPassword")}{" "}
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
