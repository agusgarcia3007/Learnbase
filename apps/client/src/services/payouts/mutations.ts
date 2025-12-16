import { useMutation } from "@tanstack/react-query";
import { payoutsMutationOptions } from "./options";

export function useStartOnboarding() {
  return useMutation(payoutsMutationOptions.startOnboarding());
}

export function useRefreshOnboarding() {
  return useMutation(payoutsMutationOptions.refreshOnboarding());
}

export function useGetDashboardLink() {
  return useMutation(payoutsMutationOptions.getDashboardLink());
}
