import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import {
  BillingService,
  QUERY_KEYS,
  type TenantPlan,
  type CheckoutResponse,
  type PortalResponse,
  type PaymentsParams,
  type ExportParams,
} from "./service";
import type { AxiosError } from "axios";

export const billingQueryOptions = {
  subscription: () =>
    queryOptions({
      queryKey: QUERY_KEYS.SUBSCRIPTION,
      queryFn: () => BillingService.getSubscription(),
    }),

  plans: () =>
    queryOptions({
      queryKey: QUERY_KEYS.PLANS,
      queryFn: () => BillingService.getPlans(),
    }),

  earnings: () =>
    queryOptions({
      queryKey: QUERY_KEYS.EARNINGS,
      queryFn: () => BillingService.getEarnings(),
    }),

  payments: (params: PaymentsParams = {}) =>
    queryOptions({
      queryKey: [...QUERY_KEYS.PAYMENTS, params] as const,
      queryFn: () => BillingService.getPayments(params),
    }),
};

export const billingMutationOptions = {
  createSubscription: (): UseMutationOptions<CheckoutResponse, AxiosError, TenantPlan> => ({
    mutationFn: (plan) => BillingService.createSubscription(plan),
  }),

  createPortalSession: (): UseMutationOptions<PortalResponse, AxiosError, void> => ({
    mutationFn: () => BillingService.createPortalSession(),
  }),

  cancelSubscription: (): UseMutationOptions<{ success: boolean }, AxiosError, void> => ({
    mutationFn: () => BillingService.cancelSubscription(),
  }),

  exportPayments: (): UseMutationOptions<Blob, AxiosError, ExportParams> => ({
    mutationFn: (params) => BillingService.exportPayments(params),
  }),
};
