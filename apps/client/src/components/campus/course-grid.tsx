import { CourseCard } from "./course-card";
import type { CampusCourse } from "@/services/campus/service";

type CourseGridProps = {
  courses: CampusCourse[];
  title?: string;
  description?: string;
};

export function CourseGrid({ courses, title, description }: CourseGridProps) {
  return (
    <section>
      {(title || description) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
