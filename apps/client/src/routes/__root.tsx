import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { getTenantFromHost } from "@/lib/tenant";

type RouterContext = {
  queryClient: QueryClient;
  isCampus: boolean;
  tenantSlug: string | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: () => {
    const { slug, isCampus } = getTenantFromHost();
    return { isCampus, tenantSlug: slug };
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
