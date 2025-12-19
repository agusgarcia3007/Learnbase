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
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { createSeoMeta } from "@/lib/seo";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { clearTokens } from "@/lib/http";
import { getCampusTenantServer } from "@/services/campus/server";
import { useLogin } from "@/services/auth/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRedirectPath, clearRedirectPath } from "@/lib/http";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/__auth/login")({
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
      title: "Sign In",
      description: `Sign in to your ${tenantName} account`,
      siteName: tenantName,
      noindex: true,
    });
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginInput) {
    login(data, {
      onSuccess: ({ user }) => {
        const currentTenant = getTenantFromHost();

        if (currentTenant.isCampus) {
          const expectedSlug = currentTenant.slug || getResolvedSlug();
          if (expectedSlug && user.tenantSlug !== expectedSlug) {
            clearTokens();
            return;
          }
          navigate({ to: "/", search: { campus: undefined } });
          return;
        }

        if (user.role === "superadmin") {
          navigate({ to: "/backoffice" });
          return;
        }

        if (user.tenantSlug) {
          navigate({ to: "/$tenantSlug", params: { tenantSlug: user.tenantSlug } });
          return;
        }

        const redirectPath = getRedirectPath();
        clearRedirectPath();
        navigate({ to: redirectPath || "/", search: { campus: undefined } });
      },
    });
  }

  return (
    <>
      <h3 className="mt-2 text-center text-lg font-bold text-white">
        {t("auth.login.title")}
      </h3>

      <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.login.emailPlaceholder")}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.password")}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t("auth.login.passwordPlaceholder")}
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/90"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>

              <Button type="submit" className="w-full" isLoading={isPending}>
                {t("common.signIn")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link
          to="/signup"
          className="font-medium text-primary hover:text-primary/90"
        >
          {t("common.signUp")}
        </Link>
      </p>
    </>
  );
}
