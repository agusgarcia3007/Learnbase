import {
  Play,
  FileText,
  HelpCircle,
  Check,
  Circle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearnModuleItem } from "@/services/learn";

type ModuleItemProps = {
  item: LearnModuleItem;
  isActive: boolean;
  onClick: () => void;
};

const contentTypeIcons = {
  video: Play,
  document: FileText,
  quiz: HelpCircle,
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ModuleItem({ item, isActive, onClick }: ModuleItemProps) {
  const ContentIcon = contentTypeIcons[item.contentType];

  const StatusIcon =
    item.status === "completed"
      ? Check
      : item.status === "in_progress"
        ? Loader2
        : Circle;

  const statusStyles = {
    completed: "text-primary",
    in_progress: "text-amber-500 animate-spin",
    not_started: "text-muted-foreground/50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all",
        "hover:bg-muted/70 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
        isActive && "bg-primary/10 ring-primary/20 ring-1"
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
        )}
      >
        <ContentIcon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm transition-colors",
            isActive ? "text-foreground font-medium" : "text-foreground/80"
          )}
        >
          {item.title}
        </p>
        {item.duration && (
          <p className="text-muted-foreground text-xs">
            {formatDuration(item.duration)}
          </p>
        )}
      </div>

      <StatusIcon
        className={cn("size-4 shrink-0", statusStyles[item.status])}
      />
    </button>
  );
}
