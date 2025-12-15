import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { analyticsService } from "@/services/analytics";

export function usePageTracking(tenantSlug: string | undefined) {
  const location = useLocation();

  useEffect(() => {
    if (!tenantSlug) return;
    analyticsService.track(tenantSlug, location.pathname);
  }, [tenantSlug, location.pathname]);
}
