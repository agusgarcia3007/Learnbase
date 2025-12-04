import { useQuery } from "@tanstack/react-query";
import {
  tenantsOptions,
  tenantsListOptions,
  tenantOptions,
  tenantStatsOptions,
  tenantOnboardingOptions,
  verifyDomainOptions,
} from "./options";
import type { TenantListParams } from "./service";

export const useGetTenants = () => useQuery(tenantsOptions);

export const useGetTenantsList = (params: TenantListParams = {}) =>
  useQuery(tenantsListOptions(params));

export const useGetTenant = (slug: string) => useQuery(tenantOptions(slug));

export const useGetTenantStats = (id: string) =>
  useQuery(tenantStatsOptions(id));

export const useGetOnboarding = (id: string) =>
  useQuery(tenantOnboardingOptions(id));

export const useVerifyDomain = (tenantId: string, enabled: boolean) =>
  useQuery(verifyDomainOptions(tenantId, enabled));
