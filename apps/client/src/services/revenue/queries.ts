import { useQuery } from "@tanstack/react-query";
import { revenueQueryOptions } from "./options";
import type { PaymentsParams } from "./service";

type UseEarningsOptions = {
  enabled?: boolean;
};

export function useEarnings(options: UseEarningsOptions = {}) {
  return useQuery({
    ...revenueQueryOptions.earnings(),
    enabled: options.enabled ?? true,
  });
}

export function usePayments(params: PaymentsParams = {}) {
  return useQuery(revenueQueryOptions.payments(params));
}
