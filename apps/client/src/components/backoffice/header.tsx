import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function BackofficeHeader() {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const segments = currentPath.split("/").filter(Boolean);
  const pathSegments = segments.slice(1);

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      home: t("backoffice.sidebar.home"),
      users: t("backoffice.sidebar.users"),
      tenants: t("backoffice.sidebar.tenants"),
    };
    return labels[segment] || segment;
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {pathSegments.length === 0 ? (
              <BreadcrumbPage>{t("backoffice.title")}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to="/backoffice">{t("backoffice.title")}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;

            return (
              <BreadcrumbItem key={segment}>
                <BreadcrumbSeparator />
                {isLast ? (
                  <BreadcrumbPage>{getSegmentLabel(segment)}</BreadcrumbPage>
                ) : (
                  <span className="text-muted-foreground">
                    {getSegmentLabel(segment)}
                  </span>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
