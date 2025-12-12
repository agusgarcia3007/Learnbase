import { useTranslation } from "react-i18next";
import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { useGetCourses } from "@/services/courses";
import type { Course } from "@/services/courses/service";
import type { RefObject } from "react";

interface CourseMentionPopoverProps {
  open: boolean;
  searchQuery: string;
  onSelect: (course: Course) => void;
  onClose: () => void;
  excludeIds?: string[];
  anchorRef: RefObject<HTMLTextAreaElement | null>;
}

export function CourseMentionPopover({
  open,
  searchQuery,
  onSelect,
  onClose,
  excludeIds = [],
  anchorRef,
}: CourseMentionPopoverProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useGetCourses(
    {
      search: searchQuery || undefined,
      limit: 10,
    },
    { enabled: open }
  );

  const courses = (data?.courses ?? []).filter((c) => !excludeIds.includes(c.id));

  return (
    <Popover open={open} onOpenChange={(o) => !o && onClose()}>
      <PopoverAnchor virtualRef={anchorRef} />
      <PopoverContent
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="top"
        align="start"
        sideOffset={8}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : courses.length === 0 ? (
              <CommandEmpty>
                {searchQuery
                  ? t("courses.aiCreator.mention.noCourses")
                  : t("courses.aiCreator.mention.typeToSearch")}
              </CommandEmpty>
            ) : (
              <CommandGroup heading={t("courses.aiCreator.mention.courses")}>
                {courses.map((course) => (
                  <CommandItem
                    key={course.id}
                    value={course.id}
                    onSelect={() => onSelect(course)}
                    className="gap-2"
                  >
                    <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 truncate">
                      <span className="font-medium">{course.title}</span>
                    </div>
                    <Badge variant="secondary" size="xs" className="shrink-0">
                      {course.modulesCount} {t("courses.preview.modules")}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
