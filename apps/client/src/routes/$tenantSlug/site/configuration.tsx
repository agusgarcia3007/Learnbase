import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Palette, Mail, Share2, Search, Type, Globe } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useGetTenant,
  useUpdateTenant,
  useUploadLogo,
  useDeleteLogo,
  useConfigureDomain,
  useVerifyDomain,
  useRemoveDomain,
} from "@/services/tenants";
import {
  configurationSchema,
  type ConfigurationFormData,
  BrandingTab,
  ContactTab,
  SocialTab,
  SeoTab,
  TextsTab,
  DomainTab,
} from "@/components/tenant-configuration";

export const Route = createFileRoute("/$tenantSlug/site/configuration")({
  component: ConfigurationPage,
});

function ConfigurationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/configuration" });

  const { data, isLoading } = useGetTenant(tenantSlug);
  const tenant = data?.tenant;

  const updateMutation = useUpdateTenant(
    tenantSlug,
    t("dashboard.site.configuration.updateSuccess")
  );

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [baseDomain, setBaseDomain] = useState("");

  const uploadLogoMutation = useUploadLogo(tenantSlug);
  const deleteLogoMutation = useDeleteLogo(tenantSlug);
  const configureDomainMutation = useConfigureDomain(tenantSlug);
  const removeDomainMutation = useRemoveDomain(tenantSlug);
  const domainVerification = useVerifyDomain(
    tenant?.id ?? "",
    !!tenant?.customDomain
  );

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      slug: "",
      name: "",
      theme: "default",
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
      showHeaderName: true,
    },
  });

  const watchedSlug = form.watch("slug");
  const isSlugChanged = tenant && watchedSlug !== tenant.slug;

  useEffect(() => {
    if (tenant) {
      form.reset({
        slug: tenant.slug,
        name: tenant.name,
        theme: tenant.theme ?? "default",
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
        showHeaderName: tenant.showHeaderName ?? true,
      });
      setLogoUrl(tenant.logo);
      setCustomDomain(tenant.customDomain ?? "");
    }
  }, [tenant, form]);

  const handleLogoUpload = async (base64: string) => {
    if (!tenant) return "";
    const result = await uploadLogoMutation.mutateAsync({
      id: tenant.id,
      logo: base64,
    });
    setLogoUrl(result.logoUrl);
    return result.logoUrl;
  };

  const handleLogoDelete = async () => {
    if (!tenant) return;
    await deleteLogoMutation.mutateAsync(tenant.id);
    setLogoUrl(null);
  };

  const handleSubmit = (values: ConfigurationFormData) => {
    if (!tenant) return;

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

    const slugChanged = values.slug !== tenant.slug;

    updateMutation.mutate(
      {
        id: tenant.id,
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
        showHeaderName: values.showHeaderName ?? true,
      },
      {
        onSuccess: () => {
          if (slugChanged) {
            navigate({
              to: "/$tenantSlug/site/configuration",
              params: { tenantSlug: values.slug },
            });
          }
        },
      }
    );
  };

  const handleSaveDomain = () => {
    if (!tenant) return;
    configureDomainMutation.mutate(
      { id: tenant.id, customDomain: customDomain || null },
      {
        onSuccess: (result) => {
          setBaseDomain(result.baseDomain);
        },
      }
    );
  };

  const handleRemoveDomain = () => {
    if (!tenant) return;
    removeDomainMutation.mutate(tenant.id, {
      onSuccess: () => {
        setCustomDomain("");
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
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList variant="line">
            <TabsTrigger value="branding">
              <Palette className="size-4" />
              {t("dashboard.site.configuration.tabs.branding")}
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Mail className="size-4" />
              {t("dashboard.site.configuration.tabs.contact")}
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="size-4" />
              {t("dashboard.site.configuration.tabs.social")}
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="size-4" />
              {t("dashboard.site.configuration.tabs.seo")}
            </TabsTrigger>
            <TabsTrigger value="texts">
              <Type className="size-4" />
              {t("dashboard.site.configuration.tabs.texts")}
            </TabsTrigger>
            <TabsTrigger value="domain">
              <Globe className="size-4" />
              {t("dashboard.site.configuration.tabs.domain")}
            </TabsTrigger>
          </TabsList>

          <BrandingTab
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            onLogoUpload={handleLogoUpload}
            onLogoDelete={handleLogoDelete}
            isUploadingLogo={uploadLogoMutation.isPending}
            isDeletingLogo={deleteLogoMutation.isPending}
            isSlugChanged={!!isSlugChanged}
            isSaving={updateMutation.isPending}
          />

          <ContactTab isSaving={updateMutation.isPending} />

          <SocialTab isSaving={updateMutation.isPending} />

          <SeoTab isSaving={updateMutation.isPending} />

          <TextsTab isSaving={updateMutation.isPending} />

          <DomainTab
            tenantSlug={tenant?.slug}
            customDomain={customDomain}
            onCustomDomainChange={setCustomDomain}
            baseDomain={baseDomain}
            isVerified={domainVerification.data?.verified}
            onSaveDomain={handleSaveDomain}
            onRemoveDomain={handleRemoveDomain}
            isSavingDomain={configureDomainMutation.isPending}
            isRemovingDomain={removeDomainMutation.isPending}
          />
        </Tabs>
      </form>
    </FormProvider>
  );
}
