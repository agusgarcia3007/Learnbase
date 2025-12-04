import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { getTenantFromHost, setResolvedSlug } from "@/lib/tenant";
import { CampusService } from "@/services/campus/service";

type RouterContext = {
  queryClient: QueryClient;
  isCampus: boolean;
  tenantSlug: string | null;
  isCustomDomain: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const { slug, isCampus, isCustomDomain } = getTenantFromHost();

    if (isCustomDomain) {
      const hostname = window.location.hostname;
      const { tenant } = await CampusService.resolveTenant(hostname);
      setResolvedSlug(tenant.slug);
      return { isCampus: true, tenantSlug: tenant.slug, isCustomDomain: true };
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
