import { useQuery } from "@tanstack/react-query";
import { billingQueryOptions } from "./options";
import type { PaymentsParams } from "./service";

export function useSubscription() {
  return useQuery(billingQueryOptions.subscription());
}

export function usePlans() {
  return useQuery(billingQueryOptions.plans());
}

export function useEarnings() {
  return useQuery(billingQueryOptions.earnings());
}

export function usePayments(params: PaymentsParams = {}) {
  return useQuery(billingQueryOptions.payments(params));
}
