import { useState, useMemo, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleItem } from "./module-item";
import { useModuleItems } from "@/services/learn";
import type { LearnModuleLite, ModuleProgressData } from "@/services/learn";

type ModuleSectionProps = {
  module: LearnModuleLite;
  progress: ModuleProgressData | undefined;
  isExpanded: boolean;
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
  courseSlug: string;
};

function ModuleSection({
  module,
  progress,
  isExpanded,
  currentItemId,
  onItemSelect,
  courseSlug,
}: ModuleSectionProps) {
  const { data, isLoading } = useModuleItems(isExpanded ? module.id : null);
  const items = data?.items ?? [];

  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? module.itemsCount;
  const isComplete = completed === total && total > 0;

  return (
    <AccordionItem value={module.id} className="border-none">
      <AccordionTrigger className="hover:bg-muted/50 min-w-0 rounded-lg px-3 py-2.5 hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="text-foreground w-full truncate text-left text-sm font-medium leading-tight">
            {module.title}
          </span>
          <span className="text-muted-foreground text-xs">
            {completed}/{total}{" "}
            {isComplete && <span className="text-primary ml-1">✓</span>}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-1 pt-1">
        <div className="space-y-0.5 pl-1">
          {isLoading
            ? Array.from({ length: Math.max(module.itemsCount, 1) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-2"
                  >
                    <Skeleton className="size-4 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                )
              )
            : items.map((item) => (
                <ModuleItem
                  key={item.id}
                  item={item}
                  isActive={item.id === currentItemId}
                  onClick={() => onItemSelect(item.id)}
                  courseSlug={courseSlug}
                  moduleId={module.id}
                />
              ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

type ModuleAccordionProps = {
  modules: LearnModuleLite[];
  moduleProgress: Map<string, ModuleProgressData>;
  currentItemId: string | null;
  currentModuleId: string | null;
  onItemSelect: (itemId: string) => void;
  courseSlug: string;
};

export function ModuleAccordion({
  modules,
  moduleProgress,
  currentItemId,
  currentModuleId,
  onItemSelect,
  courseSlug,
}: ModuleAccordionProps) {
  const defaultOpen = useMemo(() => {
    if (currentModuleId) return [currentModuleId];
    return modules[0]?.id ? [modules[0].id] : [];
  }, [modules, currentModuleId]);

  const [expandedModules, setExpandedModules] = useState<string[]>(defaultOpen);

  useEffect(() => {
    if (currentModuleId && !expandedModules.includes(currentModuleId)) {
      setExpandedModules((prev) => [...prev, currentModuleId]);
    }
  }, [currentModuleId]);

  return (
    <Accordion
      type="multiple"
      value={expandedModules}
      onValueChange={setExpandedModules}
      className="space-y-1"
    >
      {modules.map((module) => (
        <ModuleSection
          key={module.id}
          module={module}
          progress={moduleProgress.get(module.id)}
          isExpanded={expandedModules.includes(module.id)}
          currentItemId={currentItemId}
          onItemSelect={onItemSelect}
          courseSlug={courseSlug}
        />
      ))}
    </Accordion>
  );
}
