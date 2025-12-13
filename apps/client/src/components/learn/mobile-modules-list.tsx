import { useIsMobile } from "@/hooks/use-mobile";
import { ModuleAccordion } from "./module-accordion";
import type { LearnModuleLite, ModuleProgressData } from "@/services/learn";

type MobileModulesListProps = {
  modules: LearnModuleLite[];
  moduleProgress: Map<string, ModuleProgressData>;
  currentItemId: string | null;
  currentModuleId: string | null;
  onItemSelect: (itemId: string) => void;
  courseSlug: string;
};

export function MobileModulesList({
  modules,
  moduleProgress,
  currentItemId,
  currentModuleId,
  onItemSelect,
  courseSlug,
}: MobileModulesListProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="border-t pt-4">
      <ModuleAccordion
        modules={modules}
        moduleProgress={moduleProgress}
        currentItemId={currentItemId}
        currentModuleId={currentModuleId}
        onItemSelect={onItemSelect}
        courseSlug={courseSlug}
      />
    </div>
  );
}
