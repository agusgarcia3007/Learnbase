import { useState } from "react";
import { cn } from "@/lib/utils";
import { LearnSidebar } from "./learn-sidebar";
import { LearnDrawer } from "./learn-drawer";
import { LearnHeader } from "./learn-header";
import type { LearnModule, LearnCourse } from "@/services/learn";

type LearnLayoutProps = {
  course: LearnCourse;
  modules: LearnModule[];
  progress: number;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
  children: React.ReactNode;
};

export function LearnLayout({
  course,
  modules,
  progress,
  currentItemId,
  onItemSelect,
  children,
}: LearnLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <LearnHeader
        courseTitle={course.title}
        courseSlug={course.slug}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <LearnSidebar
          modules={modules}
          progress={progress}
          currentItemId={currentItemId}
          onItemSelect={onItemSelect}
          collapsed={sidebarCollapsed}
        />

        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            "bg-gradient-to-b from-background via-background to-background/95"
          )}
        >
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>

      <LearnDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        modules={modules}
        progress={progress}
        currentItemId={currentItemId}
        onItemSelect={(itemId) => {
          onItemSelect(itemId);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
