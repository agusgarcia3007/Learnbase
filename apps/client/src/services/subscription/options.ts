import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import {
  SubscriptionService,
  QUERY_KEYS,
  type TenantPlan,
  type CheckoutResponse,
  type PortalResponse,
} from "./service";
import type { AxiosError } from "axios";

export const subscriptionQueryOptions = {
  subscription: () =>
    queryOptions({
      queryKey: QUERY_KEYS.SUBSCRIPTION,
      queryFn: () => SubscriptionService.getSubscription(),
    }),

  plans: () =>
    queryOptions({
      queryKey: QUERY_KEYS.PLANS,
      queryFn: () => SubscriptionService.getPlans(),
    }),
};

export const subscriptionMutationOptions = {
  createSubscription: (): UseMutationOptions<CheckoutResponse, AxiosError, TenantPlan> => ({
    mutationFn: (plan) => SubscriptionService.createSubscription(plan),
  }),

  createPortalSession: (): UseMutationOptions<PortalResponse, AxiosError, void> => ({
    mutationFn: () => SubscriptionService.createPortalSession(),
  }),

  cancelSubscription: (): UseMutationOptions<{ success: boolean }, AxiosError, void> => ({
    mutationFn: () => SubscriptionService.cancelSubscription(),
  }),
};
