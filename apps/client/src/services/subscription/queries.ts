import { useQuery } from "@tanstack/react-query";
import { subscriptionQueryOptions } from "./options";

export function useSubscription() {
  return useQuery(subscriptionQueryOptions.subscription());
}

export function usePlans() {
  return useQuery(subscriptionQueryOptions.plans());
}
