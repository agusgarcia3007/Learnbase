import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCampusUrl } from "@/lib/tenant";

type Tenant = {
  slug: string;
  customDomain?: string | null;
};

type User = {
  role: string;
  emailVerified: boolean;
};

type DashboardHeaderProps = {
  tenant?: Tenant;
  user?: User;
  actions?: ReactNode;
};

export function DashboardHeader({ tenant, user, actions }: DashboardHeaderProps) {
  const { t } = useTranslation();

  const campusUrl = tenant ? getCampusUrl(tenant.slug, tenant.customDomain) : null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2">
        {actions}
        {campusUrl && (
          <a href={campusUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 size-4" />
              {t("header.viewCampus")}
            </Button>
          </a>
        )}
        {tenant && user && (
          <NotificationBell
            tenantSlug={tenant.slug}
            userRole={user.role}
            emailVerified={user.emailVerified}
          />
        )}
      </div>
    </header>
  );
}
