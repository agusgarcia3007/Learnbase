import { useEffect } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";
import { setResolvedSlug } from "@/lib/tenant";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getCampusTenantServer } from "@/services/campus/server";
import { computeThemeStyles } from "@/lib/theme.server";
import { createGoogleFontLinks, createFaviconLinks } from "@/lib/seo";

export const Route = createFileRoute("/__auth")({
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    if (!tenantInfo.isCampus || !tenantInfo.slug) {
      return { isCampus: tenantInfo.isCampus, tenant: null, themeClass: "", customStyles: undefined };
    }
    const tenantData = await getCampusTenantServer({ data: { slug: tenantInfo.slug } });
    const tenant = tenantData?.tenant ?? null;
    const { themeClass, customStyles } = computeThemeStyles(tenant);
    return { isCampus: true, tenant, themeClass, customStyles };
  },
  head: ({ loaderData }) => {
    const tenant = loaderData?.tenant;
    const customTheme = tenant?.customTheme;
    const fontLinks = createGoogleFontLinks([
      customTheme?.fontHeading,
      customTheme?.fontBody,
    ]);
    const faviconLinks = createFaviconLinks(tenant?.favicon);
    return {
      links: [...fontLinks, ...faviconLinks],
    };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const loaderData = Route.useLoaderData();
  const { isCampus, tenant, themeClass, customStyles } = loaderData;

  useEffect(() => {
    if (tenant?.slug) {
      setResolvedSlug(tenant.slug);
    }
  }, [tenant?.slug]);

  if (isCampus && tenant) {
    return (
      <div className={cn("flex min-h-screen items-center justify-center", themeClass)} style={customStyles}>
        <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="mx-auto h-10 w-auto object-contain"
              />
            ) : (
              <LogoIcon className="mx-auto size-12" />
            )}
          </div>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <LogoIcon className="mx-auto size-12" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
