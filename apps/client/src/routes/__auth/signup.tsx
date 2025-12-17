import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  signupWithTenantSchema,
  type SignupWithTenantInput,
} from "@/lib/schemas/auth";
import { createSeoMeta } from "@/lib/seo";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { clearTokens } from "@/lib/http";
import { getCampusTenantServer } from "@/services/campus/server";
import { useSignup } from "@/services/auth/mutations";
import { AuthService } from "@/services/auth/service";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/__auth/signup")({
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });

    const tenant = tenantInfo.slug
      ? await getCampusTenantServer({ data: { slug: tenantInfo.slug } }).then(
          (r) => r?.tenant
        )
      : null;
    return { tenant, isCampus: tenantInfo.isCampus };
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SignupPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mutate: signup, isPending } = useSignup();
  const { tenant, isCampus } = Route.useLoaderData();
  const isOnTenantDomain = isCampus && !!tenant;
  const [currentStep, setCurrentStep] = useState(1);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugModifiedByUser, setSlugModifiedByUser] = useState(false);

  const form = useForm<SignupWithTenantInput>({
    resolver: zodResolver(signupWithTenantSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      tenantName: "",
      tenantSlug: "",
    },
  });

  const tenantName = useWatch({ control: form.control, name: "tenantName" });
  const tenantSlug = useWatch({ control: form.control, name: "tenantSlug" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!slugModifiedByUser && tenantName) {
      const generatedSlug = generateSlug(tenantName);
      form.setValue("tenantSlug", generatedSlug);
    }
  }, [tenantName, slugModifiedByUser, form]);

  useEffect(() => {
    if (!tenantSlug || tenantSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const result = await AuthService.checkSlug(tenantSlug).catch(() => ({ available: false, reason: "invalid" as const }));

      if (result.available) {
        setSlugStatus("available");
      } else if (result.reason === "taken") {
        setSlugStatus("taken");
      } else {
        setSlugStatus("invalid");
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [tenantSlug]);

  async function handleNextStep() {
    const isValid = await form.trigger(["name", "email", "password", "confirmPassword"]);
    if (isValid) {
      setCurrentStep(2);
    }
  }

  function handlePrevStep() {
    setCurrentStep(1);
  }

  function onSubmit(data: SignupWithTenantInput) {
    if (!isOnTenantDomain && slugStatus !== "available") {
      return;
    }

    signup(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        locale: i18n.language,
        tenantName: isOnTenantDomain ? undefined : data.tenantName,
        tenantSlug: isOnTenantDomain ? undefined : data.tenantSlug,
      },
      {
        onSuccess: (response) => {
          const { user } = response;

          if (isOnTenantDomain) {
            const expectedSlug = tenant?.slug || getResolvedSlug();
            if (expectedSlug && user.tenantSlug !== expectedSlug) {
              clearTokens();
              return;
            }
            navigate({ to: "/", search: { campus: undefined } });
          } else if (user.tenantSlug) {
            window.location.href = `/${user.tenantSlug}`;
          }
        },
      }
    );
  }

  return (
    <>
      <h3 className="mt-2 text-center text-lg font-bold text-white">
        {isOnTenantDomain
          ? t("auth.signup.title")
          : currentStep === 1
            ? t("auth.signup.step1Title")
            : t("auth.signup.step2Title")}
      </h3>

      {!isOnTenantDomain && (
        <div className="mx-auto mt-4 flex items-center justify-center gap-2">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  currentStep > step
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 2 && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-colors",
                    currentStep > step ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentStep === 1 && (
                <>
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
                    <Link to="/terms" className="text-primary hover:text-primary/90">
                      {t("auth.signup.termsOfUse")}
                    </Link>{" "}
                    {t("auth.signup.and")}{" "}
                    <Link to="/privacy" className="text-primary hover:text-primary/90">
                      {t("auth.signup.privacyPolicy")}
                    </Link>
                  </p>

                  {isOnTenantDomain ? (
                    <Button type="submit" className="w-full" isLoading={isPending}>
                      {t("auth.signup.createAccount")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleNextStep}
                    >
                      {t("common.continue")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              {currentStep === 2 && !isOnTenantDomain && (
                <>
                  <FormField
                    control={form.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.academyName")}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t("auth.signup.academyNamePlaceholder")}
                            autoComplete="organization"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("auth.signup.academyNameDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenantSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.academyUrl")}</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="text"
                              placeholder="my-academy"
                              className="rounded-r-none"
                              {...field}
                              onChange={(e) => {
                                setSlugModifiedByUser(true);
                                field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                              }}
                            />
                            <span className="inline-flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                              .uselearnbase.com
                            </span>
                            <div className="ml-2 flex h-5 w-5 items-center justify-center">
                              {slugStatus === "checking" && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              {slugStatus === "available" && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {(slugStatus === "taken" || slugStatus === "invalid") && (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          {slugStatus === "taken" ? (
                            <span className="text-destructive">{t("auth.signup.slugTaken")}</span>
                          ) : slugStatus === "invalid" ? (
                            <span className="text-destructive">{t("auth.signup.slugInvalid")}</span>
                          ) : slugStatus === "available" ? (
                            <span className="text-green-600">{t("auth.signup.slugAvailable")}</span>
                          ) : (
                            t("auth.signup.academyUrlDescription")
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("common.back")}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      isLoading={isPending}
                      disabled={slugStatus !== "available"}
                    >
                      {t("auth.signup.createAcademy")}
                    </Button>
                  </div>
                </>
              )}
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
