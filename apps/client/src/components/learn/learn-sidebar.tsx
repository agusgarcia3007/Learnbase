import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleAccordion } from "./module-accordion";
import { cn } from "@/lib/utils";
import type { LearnModule } from "@/services/learn";

type LearnSidebarProps = {
  modules: LearnModule[];
  progress: number;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
  collapsed: boolean;
};

export function LearnSidebar({
  modules,
  progress,
  currentItemId,
  onItemSelect,
  collapsed,
}: LearnSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "bg-muted/30 hidden flex-col border-r transition-all duration-300 lg:flex",
        collapsed ? "w-0 overflow-hidden opacity-0" : "w-80 opacity-100"
      )}
    >
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t("learn.progress")}
          </span>
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {progress}%
          </span>
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
  );
}
