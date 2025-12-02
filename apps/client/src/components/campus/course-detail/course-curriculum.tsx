import { Layers, PlayCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CampusCourseDetail, CampusCourseModule } from "@/services/campus/service";

type CourseCurriculumProps = {
  course: CampusCourseDetail;
};

function ModuleItem({ module, index }: { module: CampusCourseModule; index: number }) {
  return (
    <AccordionItem value={module.id} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="gap-4 bg-muted/40 px-4 py-3.5 hover:bg-muted/60 hover:no-underline [&[data-state=open]]:bg-muted/60 [&>svg]:size-5">
        <div className="flex flex-1 items-center justify-between text-left">
          <span className="font-semibold">
            Seccion {index + 1}: {module.title}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {module.lessonsCount} clases
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
          {Array.from({ length: module.lessonsCount }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30"
            >
              <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">Leccion {i + 1}</span>
              <span className="text-xs text-muted-foreground">Vista previa</span>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const totalModules = course.modules.length;

  if (totalModules === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold">Contenido del curso</h2>
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <Layers className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            El contenido del curso se agregara proximamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Contenido del curso</h2>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalModules} secciones · {course.lessonsCount} clases
        </span>
        <button className="font-medium text-primary hover:text-primary/80">
          Expandir todas las secciones
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Accordion type="multiple" defaultValue={course.modules[0] ? [course.modules[0].id] : []}>
          {course.modules.map((module, index) => (
            <ModuleItem key={module.id} module={module} index={index} />
          ))}
        </Accordion>
      </div>
    </div>
  );
}
