import { Button } from "@/components/ui/button";
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
import { signupSchema, type SignupInput } from "@/lib/schemas/auth";
import { createSeoMeta } from "@/lib/seo";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getCampusTenantServer } from "@/services/campus/server";
import { useSignup } from "@/services/auth/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCampusUrl } from "@/lib/tenant";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/__auth/signup")({
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
      title: "Sign Up",
      description: `Create your ${tenantName} account`,
      siteName: tenantName,
      noindex: true,
    });
  },
  component: SignupPage,
});

function SignupPage() {
  const { t } = useTranslation();
  const { mutate: signup, isPending } = useSignup();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const { i18n } = useTranslation();
  const { tenant } = Route.useLoaderData();

  function onSubmit(data: SignupInput) {
    signup(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        locale: i18n.language,
      },
      {
        onSuccess: () => {
          if (tenant) {
            window.location.href = getCampusUrl(tenant.slug, tenant.customDomain);
          } else {
            window.location.href = "/create-tenant";
          }
        },
      }
    );
  }

  return (
    <>
      <h3 className="mt-2 text-center text-lg font-bold text-foreground">
        {t("auth.signup.title")}
      </h3>

      <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.signup.name")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("auth.signup.namePlaceholder")}
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>{t("auth.signup.confirmPassword")}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t("auth.signup.confirmPasswordPlaceholder")}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-center text-xs text-muted-foreground">
                {t("auth.signup.termsText")}{" "}
                <a href="#" className="text-primary hover:text-primary/90">
                  {t("auth.signup.termsOfUse")}
                </a>{" "}
                {t("auth.signup.and")}{" "}
                <a href="#" className="text-primary hover:text-primary/90">
                  {t("auth.signup.privacyPolicy")}
                </a>
              </p>

              <Button type="submit" className="w-full" isLoading={isPending}>
                {t("auth.signup.createAccount")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.signup.hasAccount")}{" "}
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
