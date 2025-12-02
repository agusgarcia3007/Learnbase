import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUpload } from "@/components/file-upload/image-upload";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerEyeDropper,
  ColorPickerFormat,
} from "@/components/kibo-ui/color-picker";
import { AlertTriangle } from "lucide-react";

import { useGetTenant, useUpdateTenant, useUploadLogo, useDeleteLogo } from "@/services/tenants";

export const Route = createFileRoute("/$tenantSlug/site/configuration")({
  component: ConfigurationPage,
});

const configurationSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
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
      primaryColor: "",
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
        primaryColor: tenant.primaryColor ?? "",
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
        primaryColor: values.primaryColor || null,
        description: values.description || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        contactAddress: values.contactAddress || null,
        socialLinks,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        seoKeywords: values.seoKeywords || null,
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
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("dashboard.site.configuration.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.site.configuration.description")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList>
              <TabsTrigger value="branding">
                {t("dashboard.site.configuration.tabs.branding")}
              </TabsTrigger>
              <TabsTrigger value="contact">
                {t("dashboard.site.configuration.tabs.contact")}
              </TabsTrigger>
              <TabsTrigger value="social">
                {t("dashboard.site.configuration.tabs.social")}
              </TabsTrigger>
              <TabsTrigger value="seo">
                {t("dashboard.site.configuration.tabs.seo")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("dashboard.site.configuration.branding.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.site.configuration.branding.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="grid gap-6 sm:grid-cols-2">
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
                        className="max-w-48"
                      />
                      <FormDescription>
                        {t("dashboard.site.configuration.branding.logoHelp")}
                      </FormDescription>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t(
                              "dashboard.site.configuration.branding.primaryColor"
                            )}
                          </FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-2"
                                >
                                  <div
                                    className="size-5 rounded border"
                                    style={{
                                      backgroundColor: field.value || "#3b82f6",
                                    }}
                                  />
                                  <span>{field.value || "#3b82f6"}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-3">
                                <ColorPicker
                                  value={field.value || "#3b82f6"}
                                  onChange={((rgba: number[]) => {
                                    const [r, g, b] = rgba;
                                    const hex = `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
                                    field.onChange(hex);
                                  }) as (value: unknown) => void}
                                >
                                  <ColorPickerSelection className="h-32" />
                                  <ColorPickerHue className="mt-3" />
                                  <div className="mt-3 flex items-center gap-2">
                                    <ColorPickerEyeDropper />
                                    <ColorPickerFormat className="flex-1" />
                                  </div>
                                </ColorPicker>
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormDescription>
                            {t(
                              "dashboard.site.configuration.branding.primaryColorHelp"
                            )}
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
                          {t(
                            "dashboard.site.configuration.branding.siteDescription"
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder={t(
                              "dashboard.site.configuration.branding.siteDescriptionPlaceholder"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("dashboard.site.configuration.contact.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.site.configuration.contact.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                            rows={2}
                            placeholder={t(
                              "dashboard.site.configuration.contact.addressPlaceholder"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("dashboard.site.configuration.social.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.site.configuration.social.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("dashboard.site.configuration.seo.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.site.configuration.seo.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            "dashboard.site.configuration.seo.seoDescriptionHelp"
                          )}
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
                          {t(
                            "dashboard.site.configuration.seo.seoKeywordsHelp"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
