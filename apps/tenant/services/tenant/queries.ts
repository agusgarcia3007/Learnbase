import { useQuery } from "@tanstack/react-query";
import { TenantService, QUERY_KEYS } from "./service";

export function useTenantSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.TENANT_SETTINGS,
    queryFn: () => TenantService.getSettings(),
  });
}

export function useTenantCustomization() {
  return useQuery({
    queryKey: QUERY_KEYS.TENANT_CUSTOMIZATION,
    queryFn: () => TenantService.getCustomization(),
  });
}

export function useTenantAISettings() {
  return useQuery({
    queryKey: QUERY_KEYS.TENANT_AI,
    queryFn: () => TenantService.getAISettings(),
  });
}
