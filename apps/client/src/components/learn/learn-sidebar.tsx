import { useTranslation } from "react-i18next";
import { PanelLeftClose, PanelLeft, Menu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ModuleAccordion } from "./module-accordion";
import { cn } from "@/lib/utils";
import type { LearnModule } from "@/services/learn";

type LearnSidebarProps = {
  modules: LearnModule[];
  progress: number;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onOpenDrawer?: () => void;
};

export function LearnSidebar({
  modules,
  progress,
  currentItemId,
  onItemSelect,
  collapsed = false,
  onToggleCollapsed,
  onOpenDrawer,
}: LearnSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {onOpenDrawer && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Button
            size="icon"
            onClick={onOpenDrawer}
            className="size-12 rounded-full shadow-lg"
            aria-label={t("learn.openMenu")}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      )}

      <aside
        className={cn(
          "bg-muted/30 hidden flex-col border-r transition-all duration-300 lg:flex",
          collapsed ? "w-0 overflow-hidden opacity-0" : "w-96 opacity-100"
        )}
      >
        <div className="border-b p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t("learn.progress")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-semibold tabular-nums">
                {progress}%
              </span>
              {onToggleCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={onToggleCollapsed}
                  aria-label={t("learn.toggleSidebar")}
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            <ModuleAccordion
              modules={modules}
              currentItemId={currentItemId}
              onItemSelect={onItemSelect}
            />
          </div>
        </ScrollArea>
      </aside>

      {collapsed && onToggleCollapsed && (
        <div className="hidden border-r p-2 lg:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={t("learn.toggleSidebar")}
          >
            <PanelLeft className="size-5" />
          </Button>
        </div>
      )}
    </>
  );
}
