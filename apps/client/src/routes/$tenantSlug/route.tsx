import { createContext, useContext, useState, useCallback } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { TrialBanner } from "@/components/billing/trial-banner";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { OnboardingPanel } from "@/components/dashboard/onboarding-panel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { canAccessTenantDashboard, canManageSite } from "@learnbase/core";
import { setResolvedSlug } from "@/lib/tenant";
import { profileOptions } from "@/services/profile/options";
import { tenantOptions } from "@/services/tenants/options";
import { useGetOnboarding } from "@/services/tenants";
import type { OnboardingSteps } from "@/services/tenants/service";

const DEFAULT_MANUAL_STEPS: OnboardingSteps = {
  basicInfo: false,
  category: false,
  instructor: false,
  module: false,
  course: false,
};

function getManualStepsKey(tenantId: string) {
  return `onboarding-manual-steps-${tenantId}`;
}

function loadManualSteps(tenantId: string): OnboardingSteps {
  const stored = localStorage.getItem(getManualStepsKey(tenantId));
  if (!stored) return DEFAULT_MANUAL_STEPS;
  return { ...DEFAULT_MANUAL_STEPS, ...JSON.parse(stored) };
}

function saveManualSteps(tenantId: string, steps: OnboardingSteps) {
  localStorage.setItem(getManualStepsKey(tenantId), JSON.stringify(steps));
}

type OnboardingPanelContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  steps: OnboardingSteps | undefined;
  manualSteps: OnboardingSteps;
  onToggleStep: (key: keyof OnboardingSteps) => void;
  isLoading: boolean;
};

const defaultContext: OnboardingPanelContextType = {
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  steps: undefined,
  manualSteps: DEFAULT_MANUAL_STEPS,
  onToggleStep: () => {},
  isLoading: false,
};

const OnboardingPanelContext =
  createContext<OnboardingPanelContextType>(defaultContext);

// eslint-disable-next-line react-refresh/only-export-components
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

    if (!canAccessTenantDashboard(user.role)) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    if (!tenantData?.tenant) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    const { tenant } = tenantData;

    if (
      (user.role === "owner" || user.role === "instructor") &&
      user.tenantId !== tenant.id
    ) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    const isSiteRoute = location.pathname.includes("/site");
    if (isSiteRoute && !canManageSite(user.role)) {
      throw redirect({
        to: "/$tenantSlug",
        params: { tenantSlug: params.tenantSlug },
      });
    }

    const isSubscriptionRoute = location.pathname.includes(
      "/finance/subscription"
    );
    if (
      !isSubscriptionRoute &&
      user.role === "owner" &&
      !hasValidSubscription(tenant)
    ) {
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
  const { data: onboardingData, isLoading } = useGetOnboarding(
    tenant?.id ?? ""
  );
  const [isOpen, setIsOpen] = useState(true);
  const [manualSteps, setManualSteps] = useState<OnboardingSteps>(() =>
    tenant ? loadManualSteps(tenant.id) : DEFAULT_MANUAL_STEPS
  );

  const onToggleStep = useCallback(
    (key: keyof OnboardingSteps) => {
      if (!tenant) return;
      setManualSteps((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveManualSteps(tenant.id, updated);
        return updated;
      });
    },
    [tenant]
  );

  const steps = onboardingData?.steps;
  const allStepsCompleted =
    steps &&
    Object.keys(steps).every(
      (key) =>
        steps[key as keyof OnboardingSteps] ||
        manualSteps[key as keyof OnboardingSteps]
    );
  const showOnboardingPanel = steps && !allStepsCompleted;

  const panelContext: OnboardingPanelContextType = {
    isOpen: showOnboardingPanel ? isOpen : false,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    steps,
    manualSteps,
    onToggleStep,
    isLoading,
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
      <SidebarProvider defaultRightOpen={false}>
        <DashboardSidebar tenant={tenant} user={user} />
        <SidebarInset>
          <DashboardHeader tenant={tenant} user={user} />
          <TrialBanner tenantSlug={tenant.slug} />
          <main className="flex-1 md:overflow-hidden p-4">
            <Outlet />
          </main>
        </SidebarInset>
        {showOnboardingPanel && steps && (
          <OnboardingPanel
            tenant={tenant}
            steps={steps}
            manualSteps={manualSteps}
            onToggleStep={onToggleStep}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onOpen={() => setIsOpen(true)}
          />
        )}
      </SidebarProvider>
    </OnboardingPanelContext.Provider>
  );
}
