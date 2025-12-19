import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@learnbase/ui";
import { Badge } from "@learnbase/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import { VoteButtons } from "./vote-buttons";
import { cn } from "@/lib/utils";
import type { Feature } from "@/services/features";

interface FeatureCardProps {
  feature: Feature;
  onVote: (id: string, value: 1 | -1) => void;
  onClick?: () => void;
  canVote?: boolean;
  className?: string;
}

const priorityVariants: Record<
  Feature["priority"],
  { variant: "destructive" | "warning" | "info" | "secondary"; label: string }
> = {
  critical: { variant: "destructive", label: "features.priority.critical" },
  high: { variant: "warning", label: "features.priority.high" },
  medium: { variant: "info", label: "features.priority.medium" },
  low: { variant: "secondary", label: "features.priority.low" },
};

export function FeatureCard({
  feature,
  onVote,
  onClick,
  canVote = true,
  className,
}: FeatureCardProps) {
  const { t } = useTranslation();
  const priority = priorityVariants[feature.priority];

  const handleVote = (value: 1 | -1) => {
    onVote(feature.id, value);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex gap-3 p-3">
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons
            voteCount={feature.voteCount}
            userVote={feature.userVote}
            onVote={handleVote}
            disabled={!canVote}
            size="sm"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 font-medium text-sm leading-tight">
              {feature.title}
            </h4>
            <Badge
              variant={priority.variant}
              appearance="light"
              size="xs"
              className="shrink-0"
            >
              {t(priority.label)}
            </Badge>
          </div>
          {feature.description && (
            <p className="line-clamp-2 text-muted-foreground text-xs">
              {feature.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={feature.submittedBy.avatar ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {feature.submittedBy.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs">
              {feature.submittedBy.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
