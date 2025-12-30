import { zodResolver } from "@hookform/resolvers/zod";
import { IconBrandApple, IconBrandGoogle, IconMail } from "@tabler/icons-react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Key, Plus, Puzzle, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Firebase } from "@/components/ui/svgs/firebase";
import { createSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useGetCourses } from "@/services/courses";
import { useGetTenant, useUpdateAuthSettings } from "@/services/tenants";

const authSettingsSchema = z
  .object({
    provider: z.enum(["local", "firebase"]),
    firebaseProjectId: z.string().optional(),
    firebaseApiKey: z.string().optional(),
    firebaseAuthDomain: z.string().optional(),
    enableGoogle: z.boolean(),
    enableApple: z.boolean(),
    enableEmailPassword: z.boolean(),
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
  connectedLabel?: string;
  comingSoonLabel?: string;
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
  connectedLabel,
  comingSoonLabel,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 transition-all duration-300",
        !isComingSoon &&
          "hover:border-border hover:shadow-lg hover:shadow-black/5",
        isComingSoon && "opacity-60"
      )}
    >
      {isConnected && (
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          {connectedLabel}
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
          isConnected &&
            "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5 dark:text-emerald-400"
        )}
        onClick={onAction}
        disabled={isComingSoon}
      >
        {isComingSoon ? comingSoonLabel : buttonLabel}
      </Button>
    </div>
  );
}

function IntegrationsPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/integrations" });
  const [firebaseDialogOpen, setFirebaseDialogOpen] = useState(false);
  const [claimMappings, setClaimMappings] = useState<
    Array<{ claim: string; courseId: string }>
  >([]);
  const [mappingClaim, setMappingClaim] = useState("");
  const [mappingCourseId, setMappingCourseId] = useState("");

  const { data, isLoading } = useGetTenant(tenantSlug);
  const { data: coursesData } = useGetCourses({ limit: 100 });
  const tenant = data?.tenant;

  const updateMutation = useUpdateAuthSettings(tenantSlug);

  const form = useForm<AuthSettingsFormData>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      provider: tenant?.authSettings?.provider ?? "local",
      firebaseProjectId: tenant?.authSettings?.firebaseProjectId ?? "",
      firebaseApiKey: tenant?.authSettings?.firebaseApiKey ?? "",
      firebaseAuthDomain: tenant?.authSettings?.firebaseAuthDomain ?? "",
      enableGoogle: tenant?.authSettings?.enableGoogle ?? true,
      enableApple: tenant?.authSettings?.enableApple ?? true,
      enableEmailPassword: tenant?.authSettings?.enableEmailPassword ?? true,
    },
  });

  const isFirebaseConnected = tenant?.authSettings?.provider === "firebase";

  const handleOpenFirebaseDialog = () => {
    form.reset({
      provider: tenant?.authSettings?.provider ?? "local",
      firebaseProjectId: tenant?.authSettings?.firebaseProjectId ?? "",
      firebaseApiKey: tenant?.authSettings?.firebaseApiKey ?? "",
      firebaseAuthDomain: tenant?.authSettings?.firebaseAuthDomain ?? "",
      enableGoogle: tenant?.authSettings?.enableGoogle ?? true,
      enableApple: tenant?.authSettings?.enableApple ?? true,
      enableEmailPassword: tenant?.authSettings?.enableEmailPassword ?? true,
    });
    setClaimMappings(tenant?.authSettings?.claimMappings ?? []);
    setMappingClaim("");
    setMappingCourseId("");
    setFirebaseDialogOpen(true);
  };

  const handleAddMapping = () => {
    if (
      mappingClaim.trim() &&
      mappingCourseId &&
      !claimMappings.some((m) => m.claim === mappingClaim.trim())
    ) {
      setClaimMappings([
        ...claimMappings,
        { claim: mappingClaim.trim(), courseId: mappingCourseId },
      ]);
      setMappingClaim("");
      setMappingCourseId("");
    }
  };

  const handleRemoveMapping = (claim: string) => {
    setClaimMappings(claimMappings.filter((m) => m.claim !== claim));
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
          values.provider === "firebase"
            ? values.firebaseAuthDomain
            : undefined,
        enableGoogle: values.enableGoogle,
        enableApple: values.enableApple,
        enableEmailPassword: values.enableEmailPassword,
        claimMappings:
          values.provider === "firebase" && claimMappings.length > 0
            ? claimMappings
            : undefined,
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
            buttonLabel={
              isFirebaseConnected
                ? t("dashboard.site.integrations.configure")
                : t("dashboard.site.integrations.connect")
            }
            onAction={handleOpenFirebaseDialog}
            isConnected={isFirebaseConnected}
            connectedLabel={t("dashboard.site.integrations.connected")}
            accentColor="firebase"
          />

          <IntegrationCard
            icon={<Zap className="size-8 text-primary" />}
            name={t("dashboard.site.integrations.webhooks")}
            description={t("dashboard.site.integrations.webhooksDescription")}
            buttonLabel={t("dashboard.site.integrations.configure")}
            onAction={() => {}}
            isComingSoon
            comingSoonLabel={t("dashboard.site.integrations.comingSoon")}
            accentColor="primary"
          />

          <IntegrationCard
            icon={<Sparkles className="size-8 text-primary" />}
            name={t("dashboard.site.integrations.analytics")}
            description={t("dashboard.site.integrations.analyticsDescription")}
            buttonLabel={t("dashboard.site.integrations.configure")}
            onAction={() => {}}
            isComingSoon
            comingSoonLabel={t("dashboard.site.integrations.comingSoon")}
            accentColor="primary"
          />
        </div>
      </div>

      <Dialog open={firebaseDialogOpen} onOpenChange={setFirebaseDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
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
                      <span className="font-medium">
                        {t("dashboard.site.integrations.connected")}
                      </span>
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
                          <Input {...field} placeholder="AIzaSyC..." />
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

              <div className="space-y-4">
                <FormLabel>
                  {t("dashboard.site.integrations.authMethods")}
                </FormLabel>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="enableGoogle"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="flex items-center gap-2">
                          <IconBrandGoogle className="size-4" />
                          <FormLabel className="font-normal cursor-pointer">
                            Google
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enableApple"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="flex items-center gap-2">
                          <IconBrandApple className="size-4" />
                          <FormLabel className="font-normal cursor-pointer">
                            Apple
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enableEmailPassword"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="flex items-center gap-2">
                          <IconMail className="size-4" />
                          <FormLabel className="font-normal cursor-pointer">
                            {t("dashboard.site.integrations.emailPassword")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  {t("dashboard.site.integrations.authMethodsHelp")}
                </FormDescription>
              </div>

              {isFirebaseConnected && (
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium">
                    {t("dashboard.site.integrations.claimMappings")}
                  </FormLabel>
                  {claimMappings.length > 0 && (
                    <div className="space-y-2">
                      {claimMappings.map((mapping) => {
                        const course = coursesData?.courses.find(
                          (c) => c.id === mapping.courseId
                        );
                        return (
                          <div
                            key={mapping.claim}
                            className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{mapping.claim}</Badge>
                              <span className="text-muted-foreground">→</span>
                              <span>{course?.title ?? mapping.courseId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMapping(mapping.claim)}
                              className="rounded-full p-1 hover:bg-muted"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                    <Input
                      value={mappingClaim}
                      onChange={(e) => setMappingClaim(e.target.value)}
                      placeholder={t("dashboard.site.integrations.claimName")}
                    />
                    <Select
                      value={mappingCourseId}
                      onValueChange={setMappingCourseId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "dashboard.site.integrations.selectCourse"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {coursesData?.courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddMapping}
                      disabled={!mappingClaim.trim() || !mappingCourseId}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <FormDescription className="text-xs">
                    {t("dashboard.site.integrations.claimMappingsHelp")}
                  </FormDescription>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                {isFirebaseConnected ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDisconnectFirebase}
                      isLoading={updateMutation.isPending}
                    >
                      {t("dashboard.site.integrations.disconnect")}
                    </Button>
                    <Button type="submit" isLoading={updateMutation.isPending}>
                      {t("common.saveChanges")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    isLoading={updateMutation.isPending}
                    onClick={() => form.setValue("provider", "firebase")}
                  >
                    {t("dashboard.site.integrations.connectFirebase")}
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
