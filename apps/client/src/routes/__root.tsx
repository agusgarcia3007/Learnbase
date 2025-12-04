import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { getTenantFromHost, setResolvedSlug } from "@/lib/tenant";
import { CampusService, QUERY_KEYS } from "@/services/campus/service";

type RouterContext = {
  queryClient: QueryClient;
  isCampus: boolean;
  tenantSlug: string | null;
  isCustomDomain: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const { slug, isCampus, isCustomDomain } = getTenantFromHost();

    if (isCustomDomain) {
      const hostname = window.location.hostname;
      const data = await CampusService.resolveTenant(hostname);
      setResolvedSlug(data.tenant.slug);
      
      // Cache the tenant data to avoid duplicate request
      context.queryClient.setQueryData(QUERY_KEYS.TENANT, data);
      
      return { isCampus: true, tenantSlug: data.tenant.slug, isCustomDomain: true };
    }

    return { isCampus, tenantSlug: slug, isCustomDomain };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}
