import { BookOpen, X } from "lucide-react";
import { Badge, BadgeButton } from "@learnbase/ui";
import type { SelectedCourse } from "@/hooks/use-course-mention";

interface CourseMentionChipProps {
  course: SelectedCourse;
  onRemove: () => void;
  disabled?: boolean;
}

export function CourseMentionChip({
  course,
  onRemove,
  disabled = false,
}: CourseMentionChipProps) {
  return (
    <Badge
      variant="primary"
      appearance="outline"
      size="md"
      className="gap-1.5 pr-1"
    >
      <BookOpen className="size-3" />
      <span className="max-w-[150px] truncate">{course.title}</span>
      <BadgeButton
        onClick={onRemove}
        aria-label="Remove course"
        disabled={disabled}
      >
        <X className="size-3" />
      </BadgeButton>
    </Badge>
  );
}
