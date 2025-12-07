import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { BackofficeHeader } from "@/components/backoffice/header";
import { BackofficeSidebar } from "@/components/backoffice/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { profileOptions } from "@/services/profile/options";

export const Route = createFileRoute("/backoffice")({
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") {
      return {};
    }

    const { queryClient } = context;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    const profileData = await queryClient.ensureQueryData(profileOptions());

    if (!profileData?.user) {
      throw redirect({ to: "/login" });
    }

    const { user } = profileData;

    if (user.role !== "superadmin") {
      throw redirect({ to: "/" });
    }

    return { user };
  },
  component: BackofficeLayout,
});

function BackofficeLayout() {
  const { user } = Route.useRouteContext();

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <BackofficeSidebar user={user} />
      <SidebarInset>
        <BackofficeHeader />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
