import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteButtons } from "./vote-buttons";
import type { Feature } from "@/services/features";

interface FeatureDetailDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVote: (id: string, value: 1 | -1) => void;
  canVote?: boolean;
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

const statusLabels: Record<Feature["status"], string> = {
  pending: "features.columns.pending",
  ideas: "features.columns.ideas",
  in_progress: "features.columns.inProgress",
  shipped: "features.columns.shipped",
};

export function FeatureDetailDialog({
  feature,
  open,
  onOpenChange,
  onVote,
  canVote = true,
}: FeatureDetailDialogProps) {
  const { t } = useTranslation();

  if (!feature) return null;

  const priority = priorityVariants[feature.priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <VoteButtons
              voteCount={feature.voteCount}
              userVote={feature.userVote}
              onVote={(value) => onVote(feature.id, value)}
              disabled={!canVote}
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left text-lg leading-tight">
                {feature.title}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={priority.variant} appearance="light" size="sm">
                  {t(priority.label)}
                </Badge>
                <Badge variant="outline" size="sm">
                  {t(statusLabels[feature.status])}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm">{feature.description}</p>
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={feature.submittedBy.avatar ?? undefined} />
                <AvatarFallback className="text-xs">
                  {feature.submittedBy.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {t("features.detail.submittedBy", {
                  name: feature.submittedBy.name,
                })}
              </span>
            </div>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(feature.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {feature.attachments && feature.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-2 font-medium text-sm">
                {t("features.detail.attachments")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {feature.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-sm hover:bg-muted"
                  >
                    {attachment.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
