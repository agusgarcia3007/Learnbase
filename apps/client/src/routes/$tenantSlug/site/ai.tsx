import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSeoMeta } from "@/lib/seo";
import { useGetTenant, useUpdateTenant } from "@/services/tenants";
import { SaveButton } from "@/components/tenant-configuration";

const aiConfigSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().max(50).optional(),
  customPrompt: z.string().max(2000).optional(),
  preferredLanguage: z.enum(["auto", "en", "es", "pt"]).default("auto"),
  tone: z
    .enum(["professional", "friendly", "casual", "academic"])
    .default("friendly"),
});

type AiConfigFormData = z.infer<typeof aiConfigSchema>;

export const Route = createFileRoute("/$tenantSlug/site/ai")({
  head: () =>
    createSeoMeta({
      title: "AI Assistant Configuration",
      description: "Configure your AI learning assistant",
      noindex: true,
    }),
  component: AiConfigurationPage,
});

function AiConfigurationPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/ai" });

  const { data, isLoading } = useGetTenant(tenantSlug);
  const tenant = data?.tenant;

  const updateMutation = useUpdateTenant(
    tenantSlug,
    t("dashboard.site.ai.updateSuccess")
  );

  const form = useForm<AiConfigFormData>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      enabled: true,
      name: "",
      customPrompt: "",
      preferredLanguage: "auto",
      tone: "friendly",
    },
  });

  useEffect(() => {
    if (tenant?.aiAssistantSettings) {
      form.reset({
        enabled: tenant.aiAssistantSettings.enabled ?? true,
        name: tenant.aiAssistantSettings.name ?? "",
        customPrompt: tenant.aiAssistantSettings.customPrompt ?? "",
        preferredLanguage:
          tenant.aiAssistantSettings.preferredLanguage ?? "auto",
        tone: tenant.aiAssistantSettings.tone ?? "friendly",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  const handleSubmit = (values: AiConfigFormData) => {
    if (!tenant) return;

    updateMutation.mutate({
      id: tenant.id,
      name: tenant.name,
      aiAssistantSettings: {
        enabled: values.enabled,
        name: values.name || undefined,
        customPrompt: values.customPrompt || undefined,
        preferredLanguage: values.preferredLanguage,
        tone: values.tone,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <CardTitle>{t("dashboard.site.ai.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("dashboard.site.ai.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("dashboard.site.ai.enabled")}
                    </FormLabel>
                    <FormDescription>
                      {t("dashboard.site.ai.enabledHelp")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dashboard.site.ai.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dashboard.site.ai.namePlaceholder")}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.ai.nameHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dashboard.site.ai.language")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="auto">
                          {t("dashboard.site.ai.languages.auto")}
                        </SelectItem>
                        <SelectItem value="en">
                          {t("dashboard.site.ai.languages.en")}
                        </SelectItem>
                        <SelectItem value="es">
                          {t("dashboard.site.ai.languages.es")}
                        </SelectItem>
                        <SelectItem value="pt">
                          {t("dashboard.site.ai.languages.pt")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("dashboard.site.ai.languageHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dashboard.site.ai.tone")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">
                          {t("dashboard.site.ai.tones.professional")}
                        </SelectItem>
                        <SelectItem value="friendly">
                          {t("dashboard.site.ai.tones.friendly")}
                        </SelectItem>
                        <SelectItem value="casual">
                          {t("dashboard.site.ai.tones.casual")}
                        </SelectItem>
                        <SelectItem value="academic">
                          {t("dashboard.site.ai.tones.academic")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("dashboard.site.ai.toneHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dashboard.site.ai.customPrompt")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder={t("dashboard.site.ai.customPromptPlaceholder")}
                      className="resize-none"
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.ai.customPromptHelp")}
                    <span className="ml-2 text-muted-foreground">
                      {field.value?.length || 0}/2000
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <SaveButton isLoading={updateMutation.isPending} />
      </form>
    </FormProvider>
  );
}
