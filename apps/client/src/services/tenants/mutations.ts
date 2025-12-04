import { useMutation } from "@tanstack/react-query";
import {
  createTenantOptions,
  updateTenantOptions,
  deleteTenantOptions,
  uploadLogoOptions,
  deleteLogoOptions,
  configureDomainOptions,
  removeDomainOptions,
} from "./options";

export const useCreateTenant = () => useMutation(createTenantOptions());

export const useUpdateTenant = (currentSlug: string, successMessage?: string) =>
  useMutation(updateTenantOptions(currentSlug, successMessage));

export const useDeleteTenant = () => useMutation(deleteTenantOptions());

export const useUploadLogo = (tenantSlug: string) =>
  useMutation(uploadLogoOptions(tenantSlug));

export const useDeleteLogo = (tenantSlug: string) =>
  useMutation(deleteLogoOptions(tenantSlug));

export const useConfigureDomain = (tenantSlug: string) =>
  useMutation(configureDomainOptions(tenantSlug));

export const useRemoveDomain = (tenantSlug: string) =>
  useMutation(removeDomainOptions(tenantSlug));
