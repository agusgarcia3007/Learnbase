import { useQuery } from "@tanstack/react-query";
import { connectQueryOptions } from "./options";

export function useConnectStatus() {
  return useQuery(connectQueryOptions.status());
}
