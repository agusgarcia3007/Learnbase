import { useState } from "react";
import { FileText, HelpCircle, Layers, Loader2, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCampusModuleItems } from "@/services/campus/queries";
import type { CampusCourseDetail, CampusCourseModule, CampusModuleItem } from "@/services/campus/service";

type CourseCurriculumProps = {
  course: CampusCourseDetail;
};

function getContentIcon(contentType: CampusModuleItem["contentType"]) {
  switch (contentType) {
    case "video":
      return PlayCircle;
    case "document":
      return FileText;
    case "quiz":
      return HelpCircle;
    default:
      return PlayCircle;
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ModuleSection({
  module,
  index,
  isExpanded,
}: {
  module: CampusCourseModule;
  index: number;
  isExpanded: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useCampusModuleItems(isExpanded ? module.id : null);
  const items = data?.items ?? [];

  return (
    <AccordionItem value={module.id} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="gap-4 bg-muted/40 px-4 py-3.5 hover:bg-muted/60 hover:no-underline [&[data-state=open]]:bg-muted/60 [&>svg]:size-5">
        <div className="flex flex-1 items-center justify-between text-left">
          <span className="font-semibold">
            {t("campus.courseDetail.section", { number: index + 1, title: module.title })}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {t("campus.courseDetail.classes", { count: module.itemsCount })}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <div className="divide-y divide-border/50">
          {module.description && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {module.description}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("common.loading")}
            </div>
          ) : (
            items.map((item) => {
              const Icon = getContentIcon(item.contentType);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.title}</span>
                  {item.duration !== undefined && item.duration > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                  {item.isPreview && (
                    <span className="text-xs font-medium text-primary">
                      {t("campus.courseDetail.preview")}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const { t } = useTranslation();
  const totalModules = course.modules.length;
  const [expandedModules, setExpandedModules] = useState<string[]>(
    course.modules[0]?.id ? [course.modules[0].id] : []
  );

  if (totalModules === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold">{t("campus.courseDetail.courseContent")}</h2>
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <Layers className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t("campus.courseDetail.contentComingSoon")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{t("campus.courseDetail.courseContent")}</h2>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t("campus.courseDetail.sectionsAndClasses", { sections: totalModules, classes: course.itemsCount })}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Accordion
          type="multiple"
          value={expandedModules}
          onValueChange={setExpandedModules}
        >
          {course.modules.map((module, index) => (
            <ModuleSection
              key={module.id}
              module={module}
              index={index}
              isExpanded={expandedModules.includes(module.id)}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
}
