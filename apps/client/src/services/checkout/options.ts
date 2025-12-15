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
};

export const checkoutMutationOptions = {
  createSession: (): UseMutationOptions<CheckoutSessionResponse, AxiosError, string[]> => ({
    mutationFn: (courseIds) => CheckoutService.createSession(courseIds),
  }),
};
