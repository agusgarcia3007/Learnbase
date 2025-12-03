import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/file-upload/image-upload";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import {
  AlertTriangle,
  Palette,
  Mail,
  Share2,
  Search,
  Check,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useGetTenant, useUpdateTenant, useUploadLogo, useDeleteLogo } from "@/services/tenants";
import type { TenantTheme } from "@/services/tenants/service";

const THEMES: { id: TenantTheme; color: string }[] = [
  { id: "violet", color: "#7c3aed" },
  { id: "blue", color: "#3b82f6" },
  { id: "emerald", color: "#10b981" },
  { id: "coral", color: "#f97316" },
];

export const Route = createFileRoute("/$tenantSlug/site/configuration")({
  component: ConfigurationPage,
});

const configurationSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1),
  theme: z.enum(["violet", "blue", "emerald", "coral"]).nullable().optional(),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  twitter: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
  heroTitle: z.string().max(100).optional(),
  heroSubtitle: z.string().max(200).optional(),
  heroCta: z.string().max(50).optional(),
  footerText: z.string().max(200).optional(),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

function ConfigurationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/configuration" });
  const { data, isLoading } = useGetTenant(tenantSlug);
  const updateMutation = useUpdateTenant(
    tenantSlug,
    t("dashboard.site.configuration.updateSuccess")
  );
  const uploadLogoMutation = useUploadLogo(tenantSlug);
  const deleteLogoMutation = useDeleteLogo(tenantSlug);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      slug: "",
      name: "",
      theme: "violet",
      description: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      twitter: "",
      facebook: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      heroTitle: "",
      heroSubtitle: "",
      heroCta: "",
      footerText: "",
    },
  });

  const watchedSlug = form.watch("slug");
  const isSlugChanged = data?.tenant && watchedSlug !== data.tenant.slug;

  useEffect(() => {
    if (data?.tenant) {
      const tenant = data.tenant;
      form.reset({
        slug: tenant.slug,
        name: tenant.name,
        theme: tenant.theme ?? "violet",
        description: tenant.description ?? "",
        contactEmail: tenant.contactEmail ?? "",
        contactPhone: tenant.contactPhone ?? "",
        contactAddress: tenant.contactAddress ?? "",
        twitter: tenant.socialLinks?.twitter ?? "",
        facebook: tenant.socialLinks?.facebook ?? "",
        instagram: tenant.socialLinks?.instagram ?? "",
        linkedin: tenant.socialLinks?.linkedin ?? "",
        youtube: tenant.socialLinks?.youtube ?? "",
        seoTitle: tenant.seoTitle ?? "",
        seoDescription: tenant.seoDescription ?? "",
        seoKeywords: tenant.seoKeywords ?? "",
        heroTitle: tenant.heroTitle ?? "",
        heroSubtitle: tenant.heroSubtitle ?? "",
        heroCta: tenant.heroCta ?? "",
        footerText: tenant.footerText ?? "",
      });
      setLogoUrl(tenant.logo);
    }
  }, [data, form]);

  const handleLogoUpload = async (base64: string) => {
    if (!data?.tenant) return "";
    const result = await uploadLogoMutation.mutateAsync({
      id: data.tenant.id,
      logo: base64,
    });
    setLogoUrl(result.logoUrl);
    return result.logoUrl;
  };

  const handleLogoDelete = async () => {
    if (!data?.tenant) return;
    await deleteLogoMutation.mutateAsync(data.tenant.id);
    setLogoUrl(null);
  };

  const handleSubmit = (values: ConfigurationFormData) => {
    if (!data?.tenant) return;

    const socialLinks =
      values.twitter ||
      values.facebook ||
      values.instagram ||
      values.linkedin ||
      values.youtube
        ? {
            twitter: values.twitter || undefined,
            facebook: values.facebook || undefined,
            instagram: values.instagram || undefined,
            linkedin: values.linkedin || undefined,
            youtube: values.youtube || undefined,
          }
        : null;

    const slugChanged = values.slug !== data.tenant.slug;

    updateMutation.mutate(
      {
        id: data.tenant.id,
        slug: values.slug,
        name: values.name,
        theme: values.theme || null,
        description: values.description || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        contactAddress: values.contactAddress || null,
        socialLinks,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        seoKeywords: values.seoKeywords || null,
        heroTitle: values.heroTitle || null,
        heroSubtitle: values.heroSubtitle || null,
        heroCta: values.heroCta || null,
        footerText: values.footerText || null,
      },
      {
        onSuccess: () => {
          if (slugChanged) {
            navigate({ to: "/$tenantSlug/site/configuration", params: { tenantSlug: values.slug } });
          }
        },
      }
    );
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="size-4" />
              {t("dashboard.site.configuration.tabs.branding")}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Mail className="size-4" />
              {t("dashboard.site.configuration.tabs.contact")}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="size-4" />
              {t("dashboard.site.configuration.tabs.social")}
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="size-4" />
              {t("dashboard.site.configuration.tabs.seo")}
            </TabsTrigger>
            <TabsTrigger value="texts" className="gap-2">
              <Type className="size-4" />
              {t("dashboard.site.configuration.tabs.texts")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.branding.slug")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.branding.slugPlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("dashboard.site.configuration.branding.slugHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.branding.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.branding.namePlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("dashboard.site.configuration.branding.nameHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isSlugChanged && (
              <Alert variant="warning" appearance="light">
                <AlertIcon>
                  <AlertTriangle />
                </AlertIcon>
                <AlertDescription>
                  {t("dashboard.site.configuration.branding.slugWarning")}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-8 sm:grid-cols-2">
              <FormItem>
                <FormLabel>
                  {t("dashboard.site.configuration.branding.logo")}
                </FormLabel>
                <ImageUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  onUpload={handleLogoUpload}
                  onDelete={handleLogoDelete}
                  aspectRatio="1/1"
                  maxSize={2 * 1024 * 1024}
                  isUploading={uploadLogoMutation.isPending}
                  isDeleting={deleteLogoMutation.isPending}
                  className="max-w-40"
                />
                <FormDescription>
                  {t("dashboard.site.configuration.branding.logoHelp")}
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.branding.theme")}
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {THEMES.map((theme) => {
                          const isSelected = field.value === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => field.onChange(theme.id)}
                              className={cn(
                                "relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              )}
                            >
                              <div
                                className="size-6 shrink-0 rounded-full ring-2 ring-border/50"
                                style={{ backgroundColor: theme.color }}
                              />
                              <span className="text-sm font-medium capitalize">
                                {t(`dashboard.site.configuration.branding.themes.${theme.id}`)}
                              </span>
                              {isSelected && (
                                <Check className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t("dashboard.site.configuration.branding.themeHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.branding.siteDescription")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t(
                        "dashboard.site.configuration.branding.siteDescriptionPlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.contact.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t(
                          "dashboard.site.configuration.contact.emailPlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.contact.phone")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.contact.phonePlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.contact.address")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t(
                        "dashboard.site.configuration.contact.addressPlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.social.twitter")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.social.placeholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.social.facebook")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.social.placeholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.social.instagram")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.social.placeholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.social.linkedin")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.social.placeholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="youtube"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      {t("dashboard.site.configuration.social.youtube")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.social.placeholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.seo.seoTitle")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.configuration.seo.seoTitlePlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.configuration.seo.seoTitleHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.seo.seoDescription")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t(
                        "dashboard.site.configuration.seo.seoDescriptionPlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.configuration.seo.seoDescriptionHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seoKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.seo.seoKeywords")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.configuration.seo.seoKeywordsPlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.configuration.seo.seoKeywordsHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="texts" className="space-y-6">
            <FormField
              control={form.control}
              name="heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.texts.heroTitle")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.configuration.texts.heroTitlePlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.configuration.texts.heroTitleHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.site.configuration.texts.heroSubtitle")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t(
                        "dashboard.site.configuration.texts.heroSubtitlePlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dashboard.site.configuration.texts.heroSubtitleHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="heroCta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.texts.heroCta")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.texts.heroCtaPlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("dashboard.site.configuration.texts.heroCtaHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dashboard.site.configuration.texts.footerText")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "dashboard.site.configuration.texts.footerTextPlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("dashboard.site.configuration.texts.footerTextHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
