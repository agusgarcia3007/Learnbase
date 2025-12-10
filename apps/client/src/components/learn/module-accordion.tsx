import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ModuleItem } from "./module-item";
import type { LearnModule } from "@/services/learn";

type ModuleAccordionProps = {
  modules: LearnModule[];
  currentItemId: string | null;
  onItemSelect: (itemId: string) => void;
};

export function ModuleAccordion({
  modules,
  currentItemId,
  onItemSelect,
}: ModuleAccordionProps) {
  const defaultOpenModules = useMemo(() => {
    if (!currentItemId) return modules[0]?.id ? [modules[0].id] : [];

    for (const module of modules) {
      if (module.items.some((item) => item.id === currentItemId)) {
        return [module.id];
      }
    }
    return modules[0]?.id ? [modules[0].id] : [];
  }, [modules, currentItemId]);

  const getModuleProgress = (module: LearnModule) => {
    const completed = module.items.filter((i) => i.status === "completed").length;
    return { completed, total: module.items.length };
  };

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenModules}
      className="space-y-1"
    >
      {modules.map((module) => {
        const { completed, total } = getModuleProgress(module);
        const isComplete = completed === total && total > 0;

        return (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border-none"
          >
            <AccordionTrigger className="hover:bg-muted/50 rounded-lg px-3 py-2.5 hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="text-foreground w-full truncate text-left text-sm font-medium leading-tight">
                  {module.title}
                </span>
                <span className="text-muted-foreground text-xs">
                  {completed}/{total}{" "}
                  {isComplete && (
                    <span className="text-primary ml-1">✓</span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-1 pt-1">
              <div className="space-y-0.5 pl-1">
                {module.items.map((item) => (
                  <ModuleItem
                    key={item.id}
                    item={item}
                    isActive={item.id === currentItemId}
                    onClick={() => onItemSelect(item.id)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
