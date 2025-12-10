import { useMutation } from "@tanstack/react-query";
import {
  useCreateTenantOptions,
  useUpdateTenantOptions,
  useDeleteTenantOptions,
  useUploadLogoOptions,
  useDeleteLogoOptions,
  useConfigureDomainOptions,
  useRemoveDomainOptions,
} from "./options";

export const useCreateTenant = () => useMutation(useCreateTenantOptions());

export const useUpdateTenant = (currentSlug: string, successMessage?: string) =>
  useMutation(useUpdateTenantOptions(currentSlug, successMessage));

export const useDeleteTenant = () => useMutation(useDeleteTenantOptions());

export const useUploadLogo = (tenantSlug: string) =>
  useMutation(useUploadLogoOptions(tenantSlug));

export const useDeleteLogo = (tenantSlug: string) =>
  useMutation(useDeleteLogoOptions(tenantSlug));

export const useConfigureDomain = (tenantSlug: string) =>
  useMutation(useConfigureDomainOptions(tenantSlug));

export const useRemoveDomain = (tenantSlug: string) =>
  useMutation(useRemoveDomainOptions(tenantSlug));
