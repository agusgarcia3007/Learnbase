import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { PayoutsService, QUERY_KEYS, type OnboardingResponse, type DashboardResponse } from "./service";
import type { AxiosError } from "axios";

export const payoutsQueryOptions = {
  status: () =>
    queryOptions({
      queryKey: QUERY_KEYS.STATUS,
      queryFn: () => PayoutsService.getStatus(),
    }),
};

export const payoutsMutationOptions = {
  startOnboarding: (): UseMutationOptions<OnboardingResponse, AxiosError, void> => ({
    mutationFn: () => PayoutsService.startOnboarding(),
  }),

  refreshOnboarding: (): UseMutationOptions<OnboardingResponse, AxiosError, void> => ({
    mutationFn: () => PayoutsService.refreshOnboarding(),
  }),

  getDashboardLink: (): UseMutationOptions<DashboardResponse, AxiosError, void> => ({
    mutationFn: () => PayoutsService.getDashboardLink(),
  }),
};
