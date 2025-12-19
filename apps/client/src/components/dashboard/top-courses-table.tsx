import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@learnbase/ui";
import { Badge } from "@/components/ui/badge";
import type { TenantTopCourse } from "@/services/tenants";

type TopCoursesTableProps = {
  courses: TenantTopCourse[] | undefined;
  isLoading: boolean;
};

export function TopCoursesTable({ courses, isLoading }: TopCoursesTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {t("dashboard.home.topCourses.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("dashboard.home.topCourses.noCourses")}
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments} {t("dashboard.home.topCourses.students")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={course.completionRate >= 50 ? "success" : "warning"}
                  appearance="light"
                  size="sm"
                >
                  {course.completionRate}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
