import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  voteCount: number;
  userVote: 1 | -1 | null;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  size?: "sm" | "default";
}

export function VoteButtons({
  voteCount,
  userVote,
  onVote,
  disabled,
  size = "default",
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? "size-4" : "size-5";
  const buttonSize = size === "sm" ? "size-6" : "size-8";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "rounded-full",
          userVote === 1 && "text-primary bg-primary/10"
        )}
        onClick={() => onVote(1)}
        disabled={disabled}
      >
        <ChevronUp className={iconSize} />
      </Button>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          voteCount > 0 && "text-primary",
          voteCount < 0 && "text-destructive"
        )}
      >
        {voteCount}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "rounded-full",
          userVote === -1 && "text-destructive bg-destructive/10"
        )}
        onClick={() => onVote(-1)}
        disabled={disabled}
      >
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
}
