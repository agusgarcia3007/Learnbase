"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SpinnerGap, Robot } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTenantAISettings,
  useUpdateTenantAISettings,
} from "@/services/tenant";

const aiSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(["openai", "anthropic"]).nullable(),
  model: z.string().nullable(),
  systemPrompt: z.string().nullable(),
});

type AIFormData = z.infer<typeof aiSchema>;

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
  ],
};

export default function AiPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useTenantAISettings();
  const updateMutation = useUpdateTenantAISettings();

  const form = useForm<AIFormData>({
    resolver: zodResolver(aiSchema),
    defaultValues: {
      enabled: false,
      provider: null,
      model: null,
      systemPrompt: null,
    },
  });

  useEffect(() => {
    if (data?.ai) {
      form.reset({
        enabled: data.ai.enabled,
        provider: data.ai.provider,
        model: data.ai.model,
        systemPrompt: data.ai.systemPrompt,
      });
    }
  }, [data, form]);

  const handleSubmit = (values: AIFormData) => {
    updateMutation.mutate({
      enabled: values.enabled,
      provider: values.provider,
      model: values.model,
      systemPrompt: values.systemPrompt,
    });
  };

  const provider = form.watch("provider");
  const enabled = form.watch("enabled");

  if (isLoading) {
    return <AiSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("site.ai.title")}</h1>
        <p className="text-muted-foreground">{t("site.ai.description")}</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{t("site.ai.enableAI")}</h2>
              <p className="text-sm text-muted-foreground">{t("site.ai.enableAIDescription")}</p>
            </div>
            <Controller
              name="enabled"
              control={form.control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    field.value ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      field.value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              )}
            />
          </div>
        </div>

        {enabled && (
          <>
            <div className="rounded-lg border border-border p-6 space-y-4">
              <h2 className="font-medium">{t("site.ai.providerSettings")}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("site.ai.provider")}</Label>
                  <Controller
                    name="provider"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value || null);
                          form.setValue("model", null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("site.ai.model")}</Label>
                  <Controller
                    name="model"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => field.onChange(value || null)}
                        disabled={!provider}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {provider &&
                            MODEL_OPTIONS[provider]?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-6 space-y-4">
              <h2 className="font-medium">{t("site.ai.systemPrompt")}</h2>
              <p className="text-sm text-muted-foreground">{t("site.ai.systemPromptDescription")}</p>

              <Controller
                name="systemPrompt"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    rows={6}
                    placeholder={t("site.ai.systemPromptPlaceholder")}
                  />
                )}
              />
            </div>
          </>
        )}

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </form>
    </div>
  );
}

function AiSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
