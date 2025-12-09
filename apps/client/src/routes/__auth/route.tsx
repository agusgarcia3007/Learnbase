import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { campusTenantOptions } from "@/services/campus/options";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useCustomTheme } from "@/hooks/use-custom-theme";

export const Route = createFileRoute("/__auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { isCampus } = Route.useRouteContext();

  if (isCampus) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="mx-auto h-10 w-10 animate-pulse rounded bg-muted" />
          </div>
        }
      >
        <TenantAuthLayout />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Logo className="mx-auto h-7" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function TenantAuthLayout() {
  const { data } = useSuspenseQuery(campusTenantOptions());
  const tenant = data?.tenant;
  const { customStyles } = useCustomTheme(tenant?.customTheme);
  const themeClass = !tenant?.customTheme && tenant?.theme ? `theme-${tenant.theme}` : "";

  return (
    <div className={cn("flex min-h-screen items-center justify-center", themeClass)} style={customStyles}>
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {tenant?.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="mx-auto h-10 w-auto object-contain"
            />
          ) : (
            <Logo className="mx-auto h-7" />
          )}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
