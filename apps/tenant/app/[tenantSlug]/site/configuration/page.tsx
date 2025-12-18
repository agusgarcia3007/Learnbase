"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SpinnerGap, Gear } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTenantSettings,
  useUpdateTenantSettings,
} from "@/services/tenant";

const configSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  domain: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function ConfigurationPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useTenantSettings();
  const updateMutation = useUpdateTenantSettings();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      supportEmail: "",
      twitter: "",
      facebook: "",
      instagram: "",
      youtube: "",
      linkedin: "",
    },
  });

  useEffect(() => {
    if (data?.tenant) {
      form.reset({
        name: data.tenant.name,
        description: data.tenant.description ?? "",
        domain: data.tenant.domain ?? "",
        supportEmail: data.tenant.supportEmail ?? "",
        twitter: data.tenant.socialLinks?.twitter ?? "",
        facebook: data.tenant.socialLinks?.facebook ?? "",
        instagram: data.tenant.socialLinks?.instagram ?? "",
        youtube: data.tenant.socialLinks?.youtube ?? "",
        linkedin: data.tenant.socialLinks?.linkedin ?? "",
      });
    }
  }, [data, form]);

  const handleSubmit = (values: ConfigFormData) => {
    const socialLinks =
      values.twitter || values.facebook || values.instagram || values.youtube || values.linkedin
        ? {
            twitter: values.twitter || undefined,
            facebook: values.facebook || undefined,
            instagram: values.instagram || undefined,
            youtube: values.youtube || undefined,
            linkedin: values.linkedin || undefined,
          }
        : null;

    updateMutation.mutate({
      name: values.name,
      description: values.description || null,
      domain: values.domain || null,
      supportEmail: values.supportEmail || null,
      socialLinks,
    });
  };

  if (isLoading) {
    return <ConfigurationSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("site.configuration.title")}</h1>
        <p className="text-muted-foreground">{t("site.configuration.description")}</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium">{t("site.configuration.general")}</h2>

          <div className="space-y-2">
            <Label htmlFor="name">{t("site.configuration.name")}</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("site.configuration.descriptionField")}</Label>
            <Textarea id="description" {...form.register("description")} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">{t("site.configuration.domain")}</Label>
              <Input id="domain" {...form.register("domain")} placeholder="example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">{t("site.configuration.supportEmail")}</Label>
              <Input id="supportEmail" type="email" {...form.register("supportEmail")} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium">{t("site.configuration.socialLinks")}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input id="twitter" {...form.register("twitter")} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" {...form.register("facebook")} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" {...form.register("instagram")} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input id="youtube" {...form.register("youtube")} placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" {...form.register("linkedin")} placeholder="https://linkedin.com/..." />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </form>
    </div>
  );
}

function ConfigurationSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
