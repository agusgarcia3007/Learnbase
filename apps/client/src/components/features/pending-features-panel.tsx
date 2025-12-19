import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@learnbase/ui";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@learnbase/ui";
import { Card, CardContent } from "@/components/ui/card";
import type { Feature } from "@/services/features";

interface PendingFeaturesPanelProps {
  features: Feature[];
  onApprove: (feature: Feature) => void;
  onReject: (feature: Feature) => void;
  isLoading?: boolean;
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

export function PendingFeaturesPanel({
  features,
  onApprove,
  onReject,
  isLoading,
}: PendingFeaturesPanelProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Clock className="size-8" />
        <p className="text-sm">{t("features.pending.empty")}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 p-1">
        {features.map((feature) => {
          const priority = priorityVariants[feature.priority];
          return (
            <Card key={feature.id}>
              <CardContent className="p-4">
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

                <p className="mt-2 line-clamp-2 text-muted-foreground text-xs">
                  {feature.description}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      <AvatarImage
                        src={feature.submittedBy.avatar ?? undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {feature.submittedBy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(feature.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onReject(feature)}
                    >
                      <XCircle className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-green-600 hover:bg-green-600/10 hover:text-green-600"
                      onClick={() => onApprove(feature)}
                    >
                      <CheckCircle2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
