import { mutationOptions, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";

type QueryKey = readonly unknown[];

type UploadMutationConfig<TPayload, TResponse> = {
  mutationFn: (payload: TPayload) => Promise<TResponse>;
  invalidateKeys?: (payload: TPayload, response: TResponse) => QueryKey[];
  successMessage?: string;
};

export function useUploadMutation<TPayload, TResponse>(
  config: UploadMutationConfig<TPayload, TResponse>
) {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: config.mutationFn,
    onSuccess: (response, payload) => {
      if (config.invalidateKeys) {
        config.invalidateKeys(payload, response).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      if (config.successMessage) {
        toast.success(i18n.t(config.successMessage));
      }
    },
  });
}
