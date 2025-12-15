import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingMutationOptions, billingQueryOptions } from "./options";

export function useCreateSubscription() {
  return useMutation(billingMutationOptions.createSubscription());
}

export function useCreatePortalSession() {
  return useMutation(billingMutationOptions.createPortalSession());
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    ...billingMutationOptions.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryOptions.subscription().queryKey });
    },
  });
}
