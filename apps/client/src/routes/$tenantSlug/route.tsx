import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCampusUrl, setResolvedSlug } from "@/lib/tenant";
import { profileOptions } from "@/services/profile/options";
import { tenantOptions } from "@/services/tenants/options";

function hasValidSubscription(tenant: {
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
}): boolean {
  if (tenant.subscriptionStatus === "active") {
    return true;
  }
  if (
    tenant.subscriptionStatus === "trialing" &&
    tenant.trialEndsAt &&
    new Date(tenant.trialEndsAt) > new Date()
  ) {
    return true;
  }
  return false;
}

export const Route = createFileRoute("/$tenantSlug")({
  ssr: false,
  beforeLoad: async ({ context, params, location }) => {
    setResolvedSlug(params.tenantSlug);

    const { queryClient } = context;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    const [profileData, tenantData] = await Promise.all([
      queryClient.ensureQueryData(profileOptions()),
      queryClient.ensureQueryData(tenantOptions(params.tenantSlug)),
    ]);

    if (!profileData?.user) {
      throw redirect({ to: "/login" });
    }

    const { user } = profileData;

    if (user.role !== "owner" && user.role !== "superadmin") {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    if (!tenantData?.tenant) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    const { tenant } = tenantData;

    if (user.role === "owner" && user.tenantId !== tenant.id) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    const isBillingRoute = location.pathname.includes("/billing");
    if (!isBillingRoute && user.role === "owner" && !hasValidSubscription(tenant)) {
      throw redirect({
        to: "/$tenantSlug/billing",
        params: { tenantSlug: params.tenantSlug },
      });
    }

    return { user, tenant };
  },
  component: TenantDashboardLayout,
});

function TenantDashboardLayout() {
  const { t } = useTranslation();
  const { user, tenant } = Route.useRouteContext();

  if (!user || !tenant) {
    return null;
  }

  const campusUrl = getCampusUrl(tenant.slug, tenant.customDomain);

  return (
    <SidebarProvider>
      <DashboardSidebar tenant={tenant} user={user} />
      <SidebarInset>
        <EmailVerificationBanner
          userRole={user.role}
          emailVerified={user.emailVerified}
        />
        <DashboardHeader
          actions={
            <a href={campusUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="size-4" />
                {t("dashboard.home.viewCampus")}
              </Button>
            </a>
          }
        />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
