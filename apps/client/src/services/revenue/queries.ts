import { useQuery } from "@tanstack/react-query";
import { revenueQueryOptions } from "./options";
import type { PaymentsParams } from "./service";

export function useEarnings() {
  return useQuery(revenueQueryOptions.earnings());
}

export function usePayments(params: PaymentsParams = {}) {
  return useQuery(revenueQueryOptions.payments(params));
}
