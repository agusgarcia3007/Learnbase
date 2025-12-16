import { useQuery } from "@tanstack/react-query";
import { payoutsQueryOptions } from "./options";

export function usePayoutStatus() {
  return useQuery(payoutsQueryOptions.status());
}
