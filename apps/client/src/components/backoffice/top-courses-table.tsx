import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@learnbase/ui";
import type { TopCourse } from "@/services/dashboard";
import { cn } from "@/lib/utils";

type TopCoursesTableProps = {
  courses: TopCourse[] | undefined;
  isLoading: boolean;
};

function CourseRow({
  course,
  index,
  maxEnrollments,
}: {
  course: TopCourse;
  index: number;
  maxEnrollments: number;
}) {
  const { t } = useTranslation();
  const progressWidth =
    maxEnrollments > 0 ? (course.enrollments / maxEnrollments) * 100 : 0;

  return (
    <div className="group relative">
      <div
        className="absolute inset-0 rounded-lg bg-primary/[0.03] transition-all duration-300"
        style={{ width: `${progressWidth}%` }}
      />
      <div className="relative flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/40">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {course.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {course.tenantName ?? t("common.noOrganization")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {course.enrollments.toLocaleString()}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("backoffice.dashboard.enrolled")}
            </p>
          </div>

          <div
            className={cn(
              "flex h-8 w-14 items-center justify-center rounded-md text-xs font-medium tabular-nums",
              course.completionRate >= 70
                ? "bg-emerald-500/10 text-emerald-600"
                : course.completionRate >= 40
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {course.completionRate}%
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3">
          <Skeleton className="size-6 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1 text-right">
              <Skeleton className="ml-auto h-4 w-10 rounded" />
              <Skeleton className="ml-auto h-2 w-12 rounded" />
            </div>
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopCoursesTable({ courses, isLoading }: TopCoursesTableProps) {
  const { t } = useTranslation();
  const maxEnrollments =
    courses && courses.length > 0
      ? Math.max(...courses.map((c) => c.enrollments))
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="size-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {t("backoffice.dashboard.topCourses")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("backoffice.dashboard.byEnrollments")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !courses || courses.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-xl bg-muted/30">
          <div className="text-center">
            <BookOpen className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("backoffice.dashboard.noCoursesYet")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {courses.map((course, index) => (
            <CourseRow
              key={course.id}
              course={course}
              index={index}
              maxEnrollments={maxEnrollments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
