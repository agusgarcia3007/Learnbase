import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetCourses } from "@/services/courses";
import type { Course } from "@/services/courses/service";

interface CourseMentionPopoverProps {
  open: boolean;
  searchQuery: string;
  onSelect: (course: Course) => void;
  excludeIds?: string[];
}

export function CourseMentionPopover({
  open,
  searchQuery,
  onSelect,
  excludeIds = [],
}: CourseMentionPopoverProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useGetCourses(
    {
      search: searchQuery || undefined,
      limit: 10,
    },
    { enabled: open }
  );

  const courses = useMemo(
    () => (data?.courses ?? []).filter((c) => !excludeIds.includes(c.id)),
    [data?.courses, excludeIds]
  );

  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 w-80 rounded-md border border-border bg-popover text-popover-foreground shadow-md">
      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-6 text-center text-sm">
            {searchQuery
              ? t("courses.aiCreator.mention.noCourses")
              : t("courses.aiCreator.mention.typeToSearch")}
          </div>
        ) : (
          <div className="overflow-hidden p-1.5 text-foreground">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t("courses.aiCreator.mention.courses")}
            </div>
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => onSelect(course)}
                className="relative flex cursor-pointer gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent"
              >
                <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 truncate">
                  <span className="font-medium">{course.title}</span>
                </div>
                <Badge variant="secondary" size="xs" className="shrink-0">
                  {course.modulesCount} {t("courses.preview.modules")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
