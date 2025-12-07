import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { getTenantFromHost, setResolvedSlug } from "@/lib/tenant";
import { CampusService, QUERY_KEYS } from "@/services/campus/service";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import appCss from "@/index.css?url";
import "@/i18n";

type RouterContext = {
  queryClient: QueryClient;
  isCampus: boolean;
  tenantSlug: string | null;
  isCustomDomain: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") {
      return { isCampus: false, tenantSlug: null, isCustomDomain: false };
    }

    const { slug, isCampus, isCustomDomain } = getTenantFromHost();

    if (isCustomDomain) {
      const hostname = window.location.hostname;
      const data = await CampusService.resolveTenant(hostname);
      setResolvedSlug(data.tenant.slug);

      context.queryClient.setQueryData(QUERY_KEYS.TENANT, data);

      return {
        isCampus: true,
        tenantSlug: data.tenant.slug,
        isCustomDomain: true,
      };
    }

    return { isCampus, tenantSlug: slug, isCustomDomain };
  },
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vite-ui-theme') || 'dark';
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Outlet />
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
