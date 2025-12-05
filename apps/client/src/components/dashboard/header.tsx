import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { Fragment, ReactNode } from "react";
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

type DashboardHeaderProps = {
  actions?: ReactNode;
};

export function DashboardHeader({ actions }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ strict: false });
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const segments = currentPath.split("/").filter(Boolean);
  const pathSegments = segments.slice(1);

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      home: t("dashboard.sidebar.home"),
      content: t("dashboard.sidebar.content"),
      courses: t("dashboard.sidebar.courses"),
      modules: t("dashboard.sidebar.modules"),
      videos: t("dashboard.sidebar.videos"),
      documents: t("dashboard.sidebar.documents"),
      quizzes: t("dashboard.sidebar.quizzes"),
      categories: t("dashboard.sidebar.categories"),
      instructors: t("dashboard.sidebar.instructors"),
      management: t("dashboard.sidebar.management"),
      users: t("dashboard.sidebar.users"),
      site: t("dashboard.sidebar.mySite"),
      configuration: t("dashboard.sidebar.configuration"),
      customization: t("dashboard.sidebar.customization"),
    };
    return labels[segment] || segment;
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {pathSegments.length === 0 ? (
                <BreadcrumbPage>{t("dashboard.title")}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to="/$tenantSlug"
                    params={{ tenantSlug: tenantSlug as string }}
                  >
                    {t("dashboard.title")}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const isLast = index === pathSegments.length - 1;

              return (
                <Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{getSegmentLabel(segment)}</BreadcrumbPage>
                    ) : (
                      <span className="text-muted-foreground">
                        {getSegmentLabel(segment)}
                      </span>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {actions}
    </header>
  );
}
