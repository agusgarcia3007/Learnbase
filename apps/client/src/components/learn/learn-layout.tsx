import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    if (sidebarCollapsed) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <LearnHeader
        courseTitle={course.title}
        courseSlug={course.slug}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        <ResizablePanel
          ref={sidebarPanelRef}
          defaultSize={25}
          minSize={15}
          maxSize={40}
          collapsible
          collapsedSize={0}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => setSidebarCollapsed(false)}
          className="hidden lg:block"
        >
          <LearnSidebar
            modules={modules}
            progress={progress}
            currentItemId={currentItemId}
            onItemSelect={onItemSelect}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        <ResizablePanel defaultSize={75}>
          <main
            className={cn(
              "h-full overflow-y-auto",
              "bg-gradient-to-b from-background via-background to-background/95"
            )}
          >
            <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>

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
