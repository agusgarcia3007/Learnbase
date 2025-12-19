import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarToggleTab,
  useSidebar,
} from "@/components/ui/sidebar";
import { ModuleAccordion } from "./module-accordion";
import { cn } from "@/lib/utils";
import { useCourseProgress } from "@/services/learn";
import type { LearnModuleLite, ModuleProgressData } from "@/services/learn";

type LearnContentSidebarProps = {
  courseSlug: string;
  modules: LearnModuleLite[];
  enrollmentProgress: number;
  currentItemId: string | null;
  currentModuleId: string | null;
  onItemSelect: (itemId: string) => void;
};

export function LearnContentSidebar({
  courseSlug,
  modules,
  enrollmentProgress,
  currentItemId,
  currentModuleId,
  onItemSelect,
}: LearnContentSidebarProps) {
  const { t } = useTranslation();
  const { isMobile, toggleSidebar } = useSidebar();
  const { data: progressData } = useCourseProgress(courseSlug);

  const moduleProgress = useMemo(() => {
    const map = new Map<string, ModuleProgressData>();
    if (progressData?.moduleProgress) {
      for (const p of progressData.moduleProgress) {
        map.set(p.moduleId, p);
      }
    }
    return map;
  }, [progressData]);

  const displayProgress = progressData
    ? Math.round((progressData.completedItems / progressData.totalItems) * 100) || 0
    : enrollmentProgress;

  return (
    <>
      <Sidebar side="left" collapsible="offcanvas">
        <SidebarHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {t("learn.progress")}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Progress value={displayProgress} className="h-2 flex-1" />
                <span className="text-primary text-sm font-bold tabular-nums">
                  {displayProgress}%
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 shrink-0", isMobile && "hidden")}
              onClick={toggleSidebar}
              aria-label={t("learn.toggleSidebar")}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-3">
          <ScrollArea className="flex-1">
            <ModuleAccordion
              modules={modules}
              moduleProgress={moduleProgress}
              currentItemId={currentItemId}
              currentModuleId={currentModuleId}
              onItemSelect={onItemSelect}
              courseSlug={courseSlug}
            />
          </ScrollArea>
        </SidebarContent>
      </Sidebar>

      <SidebarToggleTab
        side="left"
        icon={<ChevronRight className="size-4" />}
        label={t("learn.content")}
      />
    </>
  );
}
