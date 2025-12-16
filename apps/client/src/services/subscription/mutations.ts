import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionMutationOptions, subscriptionQueryOptions } from "./options";

export function useCreateSubscription() {
  return useMutation(subscriptionMutationOptions.createSubscription());
}

export function useCreatePortalSession() {
  return useMutation(subscriptionMutationOptions.createPortalSession());
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    ...subscriptionMutationOptions.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions.subscription().queryKey });
    },
  });
}
