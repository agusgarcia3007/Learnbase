import { useQuery } from "@tanstack/react-query";
import { checkoutQueryOptions } from "./options";

export function useSessionStatus(sessionId: string) {
  return useQuery(checkoutQueryOptions.sessionStatus(sessionId));
}

export function useEnrollmentStatus(sessionId: string) {
  return useQuery(checkoutQueryOptions.enrollmentStatus(sessionId));
}
