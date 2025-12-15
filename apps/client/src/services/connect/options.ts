import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { ConnectService, QUERY_KEYS, type OnboardingResponse, type DashboardResponse } from "./service";
import type { AxiosError } from "axios";

export const connectQueryOptions = {
  status: () =>
    queryOptions({
      queryKey: QUERY_KEYS.STATUS,
      queryFn: () => ConnectService.getStatus(),
    }),
};

export const connectMutationOptions = {
  startOnboarding: (): UseMutationOptions<OnboardingResponse, AxiosError, void> => ({
    mutationFn: () => ConnectService.startOnboarding(),
  }),

  refreshOnboarding: (): UseMutationOptions<OnboardingResponse, AxiosError, void> => ({
    mutationFn: () => ConnectService.refreshOnboarding(),
  }),

  getDashboardLink: (): UseMutationOptions<DashboardResponse, AxiosError, void> => ({
    mutationFn: () => ConnectService.getDashboardLink(),
  }),
};
