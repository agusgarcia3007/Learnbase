import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, ImageIcon, Upload, X, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { Image } from "@/components/ui/image";
import { createSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import {
  useGetTenant,
  useUpdateTenant,
  useUploadAiAvatar,
  useDeleteAiAvatar,
} from "@/services/tenants";
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
  const uploadAvatarMutation = useUploadAiAvatar(tenantSlug);
  const deleteAvatarMutation = useDeleteAiAvatar(tenantSlug);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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
      setAvatarUrl(tenant.aiAssistantSettings.avatarUrl ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File && tenant) {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);
        const result = await uploadAvatarMutation.mutateAsync({
          id: tenant.id,
          file,
        });
        setAvatarUrl(result.avatarUrl);
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
      }
    },
    [tenant, uploadAvatarMutation]
  );

  const [
    { isDragging, errors: avatarErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const handleAvatarDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenant) return;
    await deleteAvatarMutation.mutateAsync(tenant.id);
    setAvatarUrl(null);
  };

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

  const isAvatarLoading =
    uploadAvatarMutation.isPending || deleteAvatarMutation.isPending;
  const displayAvatar = localPreview || avatarUrl;

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

            <div className="grid gap-6 sm:grid-cols-2">
              <FormItem>
                <FormLabel>{t("dashboard.site.ai.avatar")}</FormLabel>
                {displayAvatar ? (
                  <div className="relative w-20">
                    <div className="relative size-20 overflow-hidden rounded-full border">
                      <Image
                        src={displayAvatar}
                        alt="AI Avatar"
                        layout="fullWidth"
                        className="h-full w-full object-cover"
                      />
                      {isAvatarLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {!isAvatarLoading && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleAvatarDelete}
                        className="absolute -right-1 -top-1 size-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex w-20 flex-col gap-2">
                    <div
                      className={cn(
                        "relative size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50",
                        isAvatarLoading && "pointer-events-none opacity-50"
                      )}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={openFileDialog}
                    >
                      <input
                        {...getInputProps()}
                        className="sr-only"
                        disabled={isAvatarLoading}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isAvatarLoading ? (
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        ) : isDragging ? (
                          <Upload className="size-5 text-primary" />
                        ) : (
                          <ImageIcon className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    {avatarErrors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {avatarErrors[0]}
                      </p>
                    )}
                  </div>
                )}
                <FormDescription>
                  {t("dashboard.site.ai.avatarHelp", {
                    size: formatBytes(2 * 1024 * 1024),
                  })}
                </FormDescription>
              </FormItem>

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
            </div>

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
