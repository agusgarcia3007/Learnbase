import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Mail, Share2, Search, Globe, Award } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSeoMeta } from "@/lib/seo";

import {
  useGetTenant,
  useUpdateTenant,
  useConfigureDomain,
  useVerifyDomain,
  useRemoveDomain,
  useUploadSignature,
  useDeleteSignature,
} from "@/services/tenants";
import {
  configurationSchema,
  type ConfigurationFormData,
  GeneralTab,
  ContactTab,
  SocialTab,
  SeoTab,
  DomainTab,
  CertificateTab,
} from "@/components/tenant-configuration";

const TABS = ["general", "contact", "social", "seo", "domain", "certificates"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/$tenantSlug/site/configuration")({
  head: () =>
    createSeoMeta({
      title: "Site Configuration",
      description: "Configure your site settings",
      noindex: true,
    }),
  component: ConfigurationPage,
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: TABS.includes(search.tab as Tab) ? (search.tab as Tab) : "general",
  }),
});

function ConfigurationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/configuration" });
  const { tab } = useSearch({ from: "/$tenantSlug/site/configuration" });

  const { data, isLoading } = useGetTenant(tenantSlug);
  const tenant = data?.tenant;

  const updateMutation = useUpdateTenant(
    tenantSlug,
    t("dashboard.site.configuration.updateSuccess")
  );

  const [customDomain, setCustomDomain] = useState("");
  const [cnameTarget, setCnameTarget] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  const configureDomainMutation = useConfigureDomain(tenantSlug);
  const uploadSignatureMutation = useUploadSignature(tenantSlug);
  const deleteSignatureMutation = useDeleteSignature(tenantSlug);
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
      description: "",
      language: "en",
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
      signatureTitle: "",
      customMessage: "",
    },
  });


  const watchedSlug = form.watch("slug");
  const isSlugChanged = tenant && watchedSlug !== tenant.slug;

  useEffect(() => {
    if (tenant) {
      form.reset({
        slug: tenant.slug,
        name: tenant.name,
        description: tenant.description ?? "",
        language: tenant.language ?? "en",
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
        signatureTitle: tenant.certificateSettings?.signatureTitle ?? "",
        customMessage: tenant.certificateSettings?.customMessage ?? "",
      });
      setCustomDomain(tenant.customDomain ?? "");
      setSignatureUrl(tenant.certificateSettings?.signatureImageUrl ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

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

    const certificateSettings =
      values.signatureTitle || values.customMessage || tenant.certificateSettings?.signatureImageKey
        ? {
            signatureImageKey: tenant.certificateSettings?.signatureImageKey,
            signatureTitle: values.signatureTitle || undefined,
            customMessage: values.customMessage || undefined,
          }
        : null;

    const slugChanged = values.slug !== tenant.slug;

    updateMutation.mutate(
      {
        id: tenant.id,
        slug: values.slug,
        name: values.name,
        description: values.description || null,
        language: values.language,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        contactAddress: values.contactAddress || null,
        socialLinks,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        seoKeywords: values.seoKeywords || null,
        certificateSettings,
      },
      {
        onSuccess: () => {
          if (slugChanged) {
            navigate({
              to: "/$tenantSlug/site/configuration",
              params: { tenantSlug: values.slug },
              search: { tab },
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
          setCnameTarget(result.cnameTarget);
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

  const handleSignatureUpload = async (file: File) => {
    if (!tenant) return "";
    const result = await uploadSignatureMutation.mutateAsync({
      id: tenant.id,
      file,
    });
    setSignatureUrl(result.signatureUrl);
    return result.signatureUrl;
  };

  const handleSignatureDelete = async () => {
    if (!tenant) return;
    await deleteSignatureMutation.mutateAsync(tenant.id);
    setSignatureUrl(null);
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
        <Tabs
          value={tab}
          onValueChange={(value) =>
            navigate({
              to: "/$tenantSlug/site/configuration",
              params: { tenantSlug },
              search: { tab: value as Tab },
              replace: true,
            })
          }
          className="space-y-6"
        >
          <TabsList variant="line" className="gap-6">
            <TabsTrigger value="general">
              <Settings className="size-4" />
              {t("dashboard.site.configuration.tabs.general")}
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
            <TabsTrigger value="domain">
              <Globe className="size-4" />
              {t("dashboard.site.configuration.tabs.domain")}
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="size-4" />
              {t("dashboard.site.configuration.tabs.certificates")}
            </TabsTrigger>
          </TabsList>

          <GeneralTab
            isSlugChanged={!!isSlugChanged}
            isSaving={updateMutation.isPending}
          />

          <ContactTab isSaving={updateMutation.isPending} />

          <SocialTab isSaving={updateMutation.isPending} />

          <SeoTab isSaving={updateMutation.isPending} />

          <DomainTab
            tenantSlug={tenant?.slug}
            savedDomain={tenant?.customDomain ?? null}
            customDomain={customDomain}
            onCustomDomainChange={setCustomDomain}
            cnameTarget={cnameTarget}
            isVerified={domainVerification.data?.verified}
            sslStatus={domainVerification.data?.sslStatus}
            onSaveDomain={handleSaveDomain}
            onRemoveDomain={handleRemoveDomain}
            isSavingDomain={configureDomainMutation.isPending}
            isRemovingDomain={removeDomainMutation.isPending}
          />

          <CertificateTab
            signatureUrl={signatureUrl}
            onSignatureChange={setSignatureUrl}
            onSignatureUpload={handleSignatureUpload}
            onSignatureDelete={handleSignatureDelete}
            isUploadingSignature={uploadSignatureMutation.isPending}
            isDeletingSignature={deleteSignatureMutation.isPending}
            isSaving={updateMutation.isPending}
          />
        </Tabs>
      </form>
    </FormProvider>
  );
}
