import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutsMutationOptions, payoutsQueryOptions } from "./options";

export function useStartOnboarding() {
  return useMutation(payoutsMutationOptions.startOnboarding());
}

export function useRefreshOnboarding() {
  return useMutation(payoutsMutationOptions.refreshOnboarding());
}

export function useGetDashboardLink() {
  const queryClient = useQueryClient();
  return useMutation({
    ...payoutsMutationOptions.getDashboardLink(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryOptions.status().queryKey });
    },
  });
}
