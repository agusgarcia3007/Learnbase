import { queryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { CheckoutService, type CheckoutSessionResponse } from "./service";
import type { AxiosError } from "axios";

export const checkoutQueryOptions = {
  sessionStatus: (sessionId: string) =>
    queryOptions({
      queryKey: ["checkout", "session", sessionId] as const,
      queryFn: () => CheckoutService.getSessionStatus(sessionId),
      enabled: Boolean(sessionId),
    }),

  enrollmentStatus: (sessionId: string) =>
    queryOptions({
      queryKey: ["checkout", "enrollment-status", sessionId] as const,
      queryFn: () => CheckoutService.getEnrollmentStatus(sessionId),
      enabled: Boolean(sessionId),
      refetchInterval: (query) => {
        if (query.state.data?.status === "completed") return false;
        return 2000;
      },
    }),
};

export const checkoutMutationOptions = {
  createSession: (): UseMutationOptions<CheckoutSessionResponse, AxiosError, string[]> => ({
    mutationFn: (courseIds) => CheckoutService.createSession(courseIds),
  }),
};
