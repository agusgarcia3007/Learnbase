import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleAccordion } from "./module-accordion";
import type { LearnModule } from "@/services/learn";

type LearnDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: LearnModule[];
  progress: number;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
};

export function LearnDrawer({
  open,
  onOpenChange,
  modules,
  progress,
  currentItemId,
  onItemSelect,
}: LearnDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-base">{t("learn.courseContent")}</DrawerTitle>
          <div className="mt-3">
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
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-2">
          <ModuleAccordion
            modules={modules}
            currentItemId={currentItemId}
            onItemSelect={onItemSelect}
          />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
