import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import {
  RevenueService,
  QUERY_KEYS,
  type PaymentsParams,
  type ExportParams,
} from "./service";
import type { AxiosError } from "axios";

export const revenueQueryOptions = {
  earnings: () =>
    queryOptions({
      queryKey: QUERY_KEYS.EARNINGS,
      queryFn: () => RevenueService.getEarnings(),
    }),

  payments: (params: PaymentsParams = {}) =>
    queryOptions({
      queryKey: [...QUERY_KEYS.PAYMENTS, params] as const,
      queryFn: () => RevenueService.getPayments(params),
    }),
};

export const revenueMutationOptions = {
  exportPayments: (): UseMutationOptions<Blob, AxiosError, ExportParams> => ({
    mutationFn: (params) => RevenueService.exportPayments(params),
  }),
};
