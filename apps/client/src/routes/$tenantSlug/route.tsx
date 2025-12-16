import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { setResolvedSlug } from "@/lib/tenant";
import { profileOptions } from "@/services/profile/options";
import { tenantOptions } from "@/services/tenants/options";

function hasValidSubscription(tenant: {
  plan: string | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
}): boolean {
  if (!tenant.plan) {
    return false;
  }
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

    const isSubscriptionRoute = location.pathname.includes("/finance/subscription");
    if (!isSubscriptionRoute && user.role === "owner" && !hasValidSubscription(tenant)) {
      throw redirect({
        to: "/$tenantSlug/finance/subscription",
        params: { tenantSlug: params.tenantSlug },
      });
    }

    return { user, tenant };
  },
  component: TenantDashboardLayout,
});

function TenantDashboardLayout() {
  const { user, tenant } = Route.useRouteContext();

  if (!user || !tenant) {
    return null;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar tenant={tenant} user={user} />
      <SidebarInset>
        <DashboardHeader tenant={tenant} user={user} />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
