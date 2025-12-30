import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import { QUERY_KEYS as CAMPUS_QUERY_KEYS } from "@/services/campus/service";
import { QUERY_KEYS as PROFILE_QUERY_KEYS } from "@/services/profile/service";
import {
  TenantsService,
  QUERY_KEYS,
  type TenantListParams,
  type UpdateTenantRequest,
  type TenantTrendPeriod,
} from "./service";

export const tenantsOptions = queryOptions({
  queryFn: () => TenantsService.list(),
  queryKey: QUERY_KEYS.TENANTS,
});

export const tenantsListOptions = (params: TenantListParams = {}) =>
  queryOptions({
    queryFn: () => TenantsService.list(params),
    queryKey: QUERY_KEYS.TENANTS_LIST(params),
  });

export const tenantOptions = (slug: string) =>
  queryOptions({
    queryFn: () => TenantsService.getBySlug(slug),
    queryKey: QUERY_KEYS.TENANT(slug),
  });

export const tenantStatsOptions = (id: string) =>
  queryOptions({
    queryFn: () => TenantsService.getStats(id),
    queryKey: QUERY_KEYS.TENANT_STATS(id),
    enabled: !!id,
  });

export const tenantOnboardingOptions = (id: string) =>
  queryOptions({
    queryFn: () => TenantsService.getOnboarding(id),
    queryKey: QUERY_KEYS.TENANT_ONBOARDING(id),
    enabled: !!id,
  });

export const useCreateTenantOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.PROFILE });
    },
  });
};

export const useUpdateTenantOptions = (
  currentSlug: string,
  successMessage?: string
) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & UpdateTenantRequest) =>
      TenantsService.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TENANT(currentSlug),
      });
      queryClient.invalidateQueries({
        queryKey: CAMPUS_QUERY_KEYS.TENANT,
      });
      if (variables.slug && variables.slug !== currentSlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TENANT(variables.slug),
        });
      }
      toast.success(
        successMessage ?? i18n.t("backoffice.tenants.edit.success")
      );
      return data;
    },
  });
};

export const useDeleteTenantOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      toast.success(i18n.t("backoffice.tenants.delete.success"));
    },
  });
};

export const useUploadLogoOptions = (tenantSlug: string) =>
  useUploadMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      TenantsService.uploadLogo(id, file),
    invalidateKeys: () => [QUERY_KEYS.TENANTS, QUERY_KEYS.TENANT(tenantSlug)],
    successMessage: "dashboard.site.configuration.logo.uploaded",
  });

export const useDeleteLogoOptions = (tenantSlug: string) =>
  useUploadMutation({
    mutationFn: TenantsService.deleteLogo,
    invalidateKeys: () => [QUERY_KEYS.TENANTS, QUERY_KEYS.TENANT(tenantSlug)],
    successMessage: "dashboard.site.configuration.logo.deleted",
  });

export const useConfigureDomainOptions = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      id,
      customDomain,
    }: {
      id: string;
      customDomain: string | null;
    }) => TenantsService.configureDomain(id, customDomain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      toast.success(i18n.t("dashboard.site.configuration.domain.saved"));
    },
  });
};

export const verifyDomainOptions = (tenantId: string, enabled: boolean) =>
  queryOptions({
    queryFn: () => TenantsService.verifyDomain(tenantId),
    queryKey: QUERY_KEYS.DOMAIN_VERIFICATION(tenantId),
    enabled,
    refetchInterval: (query) => {
      if (query.state.data?.verified) return false;
      return 5000;
    },
  });

export const useRemoveDomainOptions = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.removeDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      toast.success(i18n.t("dashboard.site.configuration.domain.removed"));
    },
  });
};

export const useUploadSignatureOptions = (tenantSlug: string) =>
  useUploadMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      TenantsService.uploadSignature(id, file),
    invalidateKeys: () => [QUERY_KEYS.TENANTS, QUERY_KEYS.TENANT(tenantSlug)],
    successMessage: "dashboard.site.configuration.certificates.signatureUploaded",
  });

export const useDeleteSignatureOptions = (tenantSlug: string) =>
  useUploadMutation({
    mutationFn: TenantsService.deleteSignature,
    invalidateKeys: () => [QUERY_KEYS.TENANTS, QUERY_KEYS.TENANT(tenantSlug)],
    successMessage: "dashboard.site.configuration.certificates.signatureDeleted",
  });

export const useUpdateAuthSettingsOptions = (
  tenantSlug: string,
  successMessage?: string
) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      id,
      provider,
      firebaseProjectId,
      firebaseApiKey,
      firebaseAuthDomain,
    }: {
      id: string;
      provider: "local" | "firebase";
      firebaseProjectId?: string;
      firebaseApiKey?: string;
      firebaseAuthDomain?: string;
    }) =>
      TenantsService.updateAuthSettings(id, {
        provider,
        firebaseProjectId,
        firebaseApiKey,
        firebaseAuthDomain,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      queryClient.invalidateQueries({ queryKey: CAMPUS_QUERY_KEYS.TENANT });
      toast.success(successMessage ?? i18n.t("dashboard.site.integrations.updateSuccess"));
    },
  });
};

export const tenantTrendsOptions = (id: string, period: TenantTrendPeriod = "30d") =>
  queryOptions({
    queryFn: () => TenantsService.getTrends(id, period),
    queryKey: QUERY_KEYS.TENANT_TRENDS(id, period),
    enabled: !!id,
  });

export const tenantTopCoursesOptions = (id: string, limit = 5) =>
  queryOptions({
    queryFn: () => TenantsService.getTopCourses(id, limit),
    queryKey: QUERY_KEYS.TENANT_TOP_COURSES(id, limit),
    enabled: !!id,
  });

export const tenantActivityOptions = (id: string, limit = 10) =>
  queryOptions({
    queryFn: () => TenantsService.getActivity(id, limit),
    queryKey: QUERY_KEYS.TENANT_ACTIVITY(id, limit),
    enabled: !!id,
  });

