import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Palette, Grid3X3, Type } from "lucide-react";

import { Skeleton } from "@learnbase/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSeoMeta } from "@/lib/seo";

import {
  useGetTenant,
  useUpdateTenant,
  useUploadLogo,
  useDeleteLogo,
} from "@/services/tenants";
import {
  customizationSchema,
  type CustomizationFormData,
  AppearanceTab,
  PatternsTab,
  TextsTab,
} from "@/components/tenant-customization";

const TABS = ["appearance", "patterns", "texts"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/$tenantSlug/site/customization")({
  head: () =>
    createSeoMeta({
      title: "Site Customization",
      description: "Customize your site appearance",
      noindex: true,
    }),
  component: CustomizationPage,
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: TABS.includes(search.tab as Tab) ? (search.tab as Tab) : "appearance",
  }),
});

function CustomizationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ from: "/$tenantSlug/site/customization" });
  const { tab } = useSearch({ from: "/$tenantSlug/site/customization" });

  const { data, isLoading } = useGetTenant(tenantSlug);
  const tenant = data?.tenant;

  const updateMutation = useUpdateTenant(
    tenantSlug,
    t("dashboard.site.customization.updateSuccess")
  );

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const uploadLogoMutation = useUploadLogo(tenantSlug);
  const deleteLogoMutation = useDeleteLogo(tenantSlug);

  const customThemeKey = useMemo(
    () => (tenant?.customTheme ? JSON.stringify(tenant.customTheme) : null),
    [tenant?.customTheme]
  );

  const form = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      theme: "default",
      mode: "auto",
      heroPattern: "grid",
      coursesPagePattern: "grid",
      showHeaderName: true,
      heroTitle: "",
      heroSubtitle: "",
      heroCta: "",
      footerText: "",
      customTheme: null,
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset(
        {
          theme: tenant.customTheme ? (tenant.theme ?? null) : (tenant.theme ?? "default"),
          mode: tenant.mode ?? "auto",
          heroPattern: tenant.heroPattern ?? "grid",
          coursesPagePattern: tenant.coursesPagePattern ?? "grid",
          showHeaderName: tenant.showHeaderName ?? true,
          heroTitle: tenant.heroTitle ?? "",
          heroSubtitle: tenant.heroSubtitle ?? "",
          heroCta: tenant.heroCta ?? "",
          footerText: tenant.footerText ?? "",
          customTheme: tenant.customTheme ?? null,
        },
        { keepDirtyValues: false }
      );
      setLogoUrl(tenant.logo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, customThemeKey]);

  const handleLogoUpload = async (file: File) => {
    if (!tenant) return "";
    const result = await uploadLogoMutation.mutateAsync({
      id: tenant.id,
      file,
    });
    setLogoUrl(result.logoUrl);
    return result.logoUrl;
  };

  const handleLogoDelete = async () => {
    if (!tenant) return;
    await deleteLogoMutation.mutateAsync(tenant.id);
    setLogoUrl(null);
  };

  const handleSubmit = (values: CustomizationFormData) => {
    if (!tenant) return;

    updateMutation.mutate({
      id: tenant.id,
      name: tenant.name,
      theme: values.theme || null,
      mode: values.mode || null,
      heroPattern: values.heroPattern,
      coursesPagePattern: values.coursesPagePattern,
      showHeaderName: values.showHeaderName ?? true,
      heroTitle: values.heroTitle || null,
      heroSubtitle: values.heroSubtitle || null,
      heroCta: values.heroCta || null,
      footerText: values.footerText || null,
      customTheme: values.customTheme || null,
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
        <Tabs
          value={tab}
          onValueChange={(value) =>
            navigate({
              to: "/$tenantSlug/site/customization",
              params: { tenantSlug },
              search: { tab: value as Tab },
              replace: true,
            })
          }
          className="space-y-6"
        >
          <TabsList variant="line" className="gap-6">
            <TabsTrigger value="appearance">
              <Palette className="size-4" />
              {t("dashboard.site.customization.tabs.appearance")}
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <Grid3X3 className="size-4" />
              {t("dashboard.site.customization.tabs.patterns")}
            </TabsTrigger>
            <TabsTrigger value="texts">
              <Type className="size-4" />
              {t("dashboard.site.customization.tabs.texts")}
            </TabsTrigger>
          </TabsList>

          <AppearanceTab
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            onLogoUpload={handleLogoUpload}
            onLogoDelete={handleLogoDelete}
            isUploadingLogo={uploadLogoMutation.isPending}
            isDeletingLogo={deleteLogoMutation.isPending}
            isSaving={updateMutation.isPending}
          />

          <PatternsTab isSaving={updateMutation.isPending} />

          <TextsTab isSaving={updateMutation.isPending} />
        </Tabs>
      </form>
    </FormProvider>
  );
}
