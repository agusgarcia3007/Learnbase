import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  TenantService,
  QUERY_KEYS,
  type UpdateTenantSettingsRequest,
  type UpdateTenantCustomizationRequest,
  type UpdateTenantAISettingsRequest,
} from "./service";

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateTenantSettingsRequest) => TenantService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT_SETTINGS });
      toast.success(t("site.configuration.success"));
    },
  });
}

export function useUpdateTenantCustomization() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateTenantCustomizationRequest) => TenantService.updateCustomization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT_CUSTOMIZATION });
      toast.success(t("site.customization.success"));
    },
  });
}

export function useUpdateTenantAISettings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateTenantAISettingsRequest) => TenantService.updateAISettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT_AI });
      toast.success(t("site.ai.success"));
    },
  });
}
