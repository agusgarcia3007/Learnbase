import { useQuery } from "@tanstack/react-query";
import { analyticsService, ANALYTICS_QUERY_KEYS } from "./service";

export function useGetVisitorStats(tenantId: string, period: string = "30d") {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.visitors(tenantId, period),
    queryFn: () => analyticsService.getVisitors(tenantId, period),
  });
}
