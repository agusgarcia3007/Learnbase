import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Key, Puzzle, Sparkles, Zap } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSeoMeta } from "@/lib/seo";
import { useGetTenant, useUpdateAuthSettings } from "@/services/tenants";
import { Firebase } from "@/components/ui/svgs/firebase";
import { cn } from "@/lib/utils";

const authSettingsSchema = z
  .object({
    provider: z.enum(["local", "firebase"]),
    firebaseProjectId: z.string().optional(),
    firebaseApiKey: z.string().optional(),
    firebaseAuthDomain: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.provider === "firebase") {
        return data.firebaseProjectId && data.firebaseProjectId.length > 0;
      }
      return true;
    },
    {
      message: "Firebase Project ID is required",
      path: ["firebaseProjectId"],
    }
  )
  .refine(
    (data) => {
      if (data.provider === "firebase") {
        return data.firebaseApiKey && data.firebaseApiKey.length > 0;
      }
      return true;
    },
    {
      message: "Firebase API Key is required",
      path: ["firebaseApiKey"],
    }
  )
  .refine(
    (data) => {
      if (data.provider === "firebase") {
        return data.firebaseAuthDomain && data.firebaseAuthDomain.length > 0;
      }
      return true;
    },
    {
      message: "Firebase Auth Domain is required",
      path: ["firebaseAuthDomain"],
    }
  );

type AuthSettingsFormData = z.infer<typeof authSettingsSchema>;

export const Route = createFileRoute("/$tenantSlug/site/integrations")({
  head: () =>
    createSeoMeta({
      title: "Integrations",
      description: "Configure authentication integrations",
      noindex: true,
    }),
  component: IntegrationsPage,
});

interface IntegrationCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  isConnected?: boolean;
  isComingSoon?: boolean;
  accentColor?: string;
}

function IntegrationCard({
  icon,
  name,
  description,
  buttonLabel,
  onAction,
  isConnected,
  isComingSoon,
  accentColor = "primary",
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 transition-all duration-300",
        !isComingSoon && "hover:border-border hover:shadow-lg hover:shadow-black/5",
        isComingSoon && "opacity-60"
      )}
    >
      {isConnected && (
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          Connected
        </Badge>
      )}

      <div
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-xl transition-transform duration-300",
          !isComingSoon && "group-hover:scale-110",
          accentColor === "firebase" && "bg-amber-500/10",
          accentColor === "primary" && "bg-primary/10"
        )}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-semibold tracking-tight">{name}</h3>

      <p className="mb-6 text-center text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      <Button
        variant="outline"
        className={cn(
          "mt-auto w-full",
          isConnected && "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5 dark:text-emerald-400"
        )}
        onClick={onAction}
        disabled={isComingSoon}
      >
        {isComingSoon ? "Coming Soon" : buttonLabel}
      </Button>
    </div>
  );
}

function IntegrationsPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/integrations" });
  const [firebaseDialogOpen, setFirebaseDialogOpen] = useState(false);

  const { data, isLoading } = useGetTenant(tenantSlug);
  const tenant = data?.tenant;

  const updateMutation = useUpdateAuthSettings(tenantSlug);

  const form = useForm<AuthSettingsFormData>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      provider: tenant?.authSettings?.provider ?? "local",
      firebaseProjectId: tenant?.authSettings?.firebaseProjectId ?? "",
      firebaseApiKey: tenant?.authSettings?.firebaseApiKey ?? "",
      firebaseAuthDomain: tenant?.authSettings?.firebaseAuthDomain ?? "",
    },
  });

  const isFirebaseConnected = tenant?.authSettings?.provider === "firebase";

  const handleOpenFirebaseDialog = () => {
    form.reset({
      provider: tenant?.authSettings?.provider ?? "local",
      firebaseProjectId: tenant?.authSettings?.firebaseProjectId ?? "",
      firebaseApiKey: tenant?.authSettings?.firebaseApiKey ?? "",
      firebaseAuthDomain: tenant?.authSettings?.firebaseAuthDomain ?? "",
    });
    setFirebaseDialogOpen(true);
  };

  const handleSubmit = (values: AuthSettingsFormData) => {
    if (!tenant) return;

    updateMutation.mutate(
      {
        id: tenant.id,
        provider: values.provider,
        firebaseProjectId:
          values.provider === "firebase" ? values.firebaseProjectId : undefined,
        firebaseApiKey:
          values.provider === "firebase" ? values.firebaseApiKey : undefined,
        firebaseAuthDomain:
          values.provider === "firebase" ? values.firebaseAuthDomain : undefined,
      },
      {
        onSuccess: () => {
          setFirebaseDialogOpen(false);
        },
      }
    );
  };

  const handleDisconnectFirebase = () => {
    if (!tenant) return;

    updateMutation.mutate(
      {
        id: tenant.id,
        provider: "local",
        firebaseProjectId: undefined,
        firebaseApiKey: undefined,
        firebaseAuthDomain: undefined,
      },
      {
        onSuccess: () => {
          setFirebaseDialogOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Puzzle className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("dashboard.site.integrations.title")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t("dashboard.site.integrations.description")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            icon={<Firebase className="size-8" />}
            name={t("dashboard.site.integrations.firebase")}
            description={t("dashboard.site.integrations.firebaseDescription")}
            buttonLabel={isFirebaseConnected ? "Configure" : "Connect"}
            onAction={handleOpenFirebaseDialog}
            isConnected={isFirebaseConnected}
            accentColor="firebase"
          />

          <IntegrationCard
            icon={<Zap className="size-8 text-primary" />}
            name="Webhooks"
            description="Send real-time notifications to your external services when events occur"
            buttonLabel="Configure"
            onAction={() => {}}
            isComingSoon
            accentColor="primary"
          />

          <IntegrationCard
            icon={<Sparkles className="size-8 text-primary" />}
            name="Analytics"
            description="Connect your preferred analytics platform to track student engagement"
            buttonLabel="Configure"
            onAction={() => {}}
            isComingSoon
            accentColor="primary"
          />
        </div>
      </div>

      <Dialog open={firebaseDialogOpen} onOpenChange={setFirebaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Firebase className="size-6" />
              </div>
              <div>
                <DialogTitle>
                  {t("dashboard.site.integrations.firebase")}
                </DialogTitle>
                <DialogDescription>
                  {t("dashboard.site.integrations.firebaseDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {isFirebaseConnected ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Key className="size-4" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Project ID: {tenant?.authSettings?.firebaseProjectId}
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t("dashboard.site.integrations.firebaseWarning")}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <input type="hidden" {...form.register("provider")} />
                  <FormField
                    control={form.control}
                    name="firebaseProjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("dashboard.site.integrations.projectId")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="my-project-123"
                            pattern="^[a-z0-9-]+$"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("dashboard.site.integrations.projectIdHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="firebaseApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("dashboard.site.integrations.apiKey")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="AIzaSyC..."
                          />
                        </FormControl>
                        <FormDescription>
                          {t("dashboard.site.integrations.apiKeyHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="firebaseAuthDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("dashboard.site.integrations.authDomain")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="my-project-123.firebaseapp.com"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("dashboard.site.integrations.authDomainHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t("dashboard.site.integrations.firebaseWarning")}
                    </p>
                  </div>
                </>
              )}

              <DialogFooter>
                {isFirebaseConnected ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDisconnectFirebase}
                    isLoading={updateMutation.isPending}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    isLoading={updateMutation.isPending}
                    onClick={() => form.setValue("provider", "firebase")}
                  >
                    Connect Firebase
                  </Button>
                )}
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
