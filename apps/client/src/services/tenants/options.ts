import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { QUERY_KEYS as PROFILE_QUERY_KEYS } from "@/services/profile/service";
import {
  TenantsService,
  QUERY_KEYS,
  type TenantListParams,
  type UpdateTenantRequest,
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

export const createTenantOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.PROFILE });
    },
  });
};

export const updateTenantOptions = (
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

export const deleteTenantOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      toast.success(i18n.t("backoffice.tenants.delete.success"));
    },
  });
};

export const uploadLogoOptions = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, logo }: { id: string; logo: string }) =>
      TenantsService.uploadLogo(id, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      toast.success(i18n.t("dashboard.site.configuration.logo.uploaded"));
    },
  });
};

export const deleteLogoOptions = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      toast.success(i18n.t("dashboard.site.configuration.logo.deleted"));
    },
  });
};

export const configureDomainOptions = (tenantSlug: string) => {
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

export const verifyDomainOptions = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.verifyDomain,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantSlug) });
      if (data.verified) {
        toast.success(i18n.t("dashboard.site.configuration.domain.verified"));
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const removeDomainOptions = (tenantSlug: string) => {
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
