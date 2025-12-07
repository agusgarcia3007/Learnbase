import type { ReactNode } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  actions?: ReactNode;
};

export function DashboardHeader({ actions }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      {actions}
    </header>
  );
}
