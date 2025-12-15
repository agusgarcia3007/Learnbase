import { useMutation, useQueryClient } from "@tanstack/react-query";
import { connectMutationOptions, connectQueryOptions } from "./options";

export function useStartOnboarding() {
  return useMutation(connectMutationOptions.startOnboarding());
}

export function useRefreshOnboarding() {
  return useMutation(connectMutationOptions.refreshOnboarding());
}

export function useGetDashboardLink() {
  const queryClient = useQueryClient();
  return useMutation({
    ...connectMutationOptions.getDashboardLink(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectQueryOptions.status().queryKey });
    },
  });
}
