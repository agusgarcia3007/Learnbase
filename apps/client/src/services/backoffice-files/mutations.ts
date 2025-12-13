import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  QUERY_KEYS,
  updateBackofficeTenant,
  uploadBackofficeFile,
  type ManualUploadRequest,
} from "./service";

export function useUpdateBackofficeTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBackofficeTenant>[1] }) =>
      updateBackofficeTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants() });
    },
  });
}

export function useUploadBackofficeFile() {
  return useMutation({
    mutationFn: (payload: ManualUploadRequest) => uploadBackofficeFile(payload),
  });
}
