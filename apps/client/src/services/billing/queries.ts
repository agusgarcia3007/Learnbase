import { useQuery } from "@tanstack/react-query";
import { billingQueryOptions } from "./options";

export function useSubscription() {
  return useQuery(billingQueryOptions.subscription());
}

export function usePlans() {
  return useQuery(billingQueryOptions.plans());
}
