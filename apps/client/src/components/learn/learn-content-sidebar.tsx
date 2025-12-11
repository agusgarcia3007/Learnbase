import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DualSidebar,
  DualSidebarHeader,
  DualSidebarContent,
  SidebarToggleTab,
  useDualSidebar,
} from "@/components/ui/dual-sidebar";
import { ModuleAccordion } from "./module-accordion";
import { cn } from "@/lib/utils";
import type { LearnModule } from "@/services/learn";

type LearnContentSidebarProps = {
  modules: LearnModule[];
  progress: number;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
};

export function LearnContentSidebar({
  modules,
  progress,
  currentItemId,
  onItemSelect,
}: LearnContentSidebarProps) {
  const { t } = useTranslation();
  const { left, isMobile } = useDualSidebar();

  return (
    <>
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            size="icon"
            onClick={() => left.setOpenMobile(true)}
            className="size-12 rounded-full shadow-lg"
            aria-label={t("learn.openMenu")}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      )}

      <DualSidebar side="left" collapsible="offcanvas">
        <DualSidebarHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {t("learn.progress")}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-primary text-sm font-bold tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 shrink-0", isMobile && "hidden")}
              onClick={left.toggle}
              aria-label={t("learn.toggleSidebar")}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </DualSidebarHeader>

        <DualSidebarContent className="p-3">
          <ScrollArea className="flex-1">
            <ModuleAccordion
              modules={modules}
              currentItemId={currentItemId}
              onItemSelect={onItemSelect}
            />
          </ScrollArea>
        </DualSidebarContent>
      </DualSidebar>

      <SidebarToggleTab
        side="left"
        icon={<ChevronRight className="size-4" />}
        label={t("learn.content")}
      />
    </>
  );
}
