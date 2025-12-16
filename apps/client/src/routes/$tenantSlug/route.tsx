import { createContext, useContext, useState } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { OnboardingPanel } from "@/components/dashboard/onboarding-panel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { setResolvedSlug } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { profileOptions } from "@/services/profile/options";
import { tenantOptions } from "@/services/tenants/options";
import { useGetOnboarding } from "@/services/tenants";

type OnboardingPanelContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const defaultContext: OnboardingPanelContextType = {
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
};

const OnboardingPanelContext = createContext<OnboardingPanelContextType>(defaultContext);

export function useOnboardingPanel() {
  return useContext(OnboardingPanelContext);
}

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
  const [isOpen, setIsOpen] = useState(false);
  const { data: onboardingData } = useGetOnboarding(tenant?.id ?? "");

  const steps = onboardingData?.steps;

  const panelContext: OnboardingPanelContextType = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };

  if (!user || !tenant) {
    return (
      <OnboardingPanelContext.Provider value={panelContext}>
        {null}
      </OnboardingPanelContext.Provider>
    );
  }

  return (
    <OnboardingPanelContext.Provider value={panelContext}>
      <SidebarProvider>
        <DashboardSidebar tenant={tenant} user={user} />
        <SidebarInset className={cn(isOpen && "mr-80")}>
          <DashboardHeader tenant={tenant} user={user} />
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </SidebarInset>
        {isOpen && steps && (
          <OnboardingPanel
            tenant={tenant}
            steps={steps}
            onClose={() => setIsOpen(false)}
          />
        )}
      </SidebarProvider>
    </OnboardingPanelContext.Provider>
  );
}
