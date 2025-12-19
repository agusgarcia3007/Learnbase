import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { useAdminEnrollment } from "@/services/admin-enrollments";

type EnrollmentDetailDialogProps = {
  enrollmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
};

const STATUS_COLORS = {
  not_started: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-green-500",
};

export function EnrollmentDetailDialog({
  enrollmentId,
  open,
  onOpenChange,
}: EnrollmentDetailDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminEnrollment(enrollmentId ?? "");

  const enrollment = data?.enrollment;

  const completedItems =
    enrollment?.itemsProgress.filter((ip) => ip.status === "completed").length ??
    0;
  const totalItems = enrollment?.itemsProgress.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dashboard.enrollments.detail.title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : enrollment ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage
                  src={enrollment.user.avatar ?? undefined}
                  alt={enrollment.user.name}
                />
                <AvatarFallback>
                  {enrollment.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{enrollment.user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {enrollment.user.email}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {enrollment.course.title}
                </span>
                <Badge
                  variant={
                    enrollment.status === "completed"
                      ? "success"
                      : enrollment.status === "active"
                        ? "info"
                        : "secondary"
                  }
                  size="sm"
                >
                  {t(`dashboard.enrollments.statuses.${enrollment.status}`)}
                </Badge>
              </div>
              <Progress value={enrollment.progress} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {enrollment.progress}%
              </div>
            </div>

            {totalItems > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {t("dashboard.enrollments.detail.itemsCompleted", {
                    completed: completedItems,
                    total: totalItems,
                  })}
                </div>
                <ScrollArea className="h-48 rounded-md border p-2">
                  <div className="space-y-2">
                    {enrollment.itemsProgress.map((ip) => {
                      const Icon = STATUS_ICONS[ip.status];
                      return (
                        <div
                          key={ip.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Icon
                            className={`size-4 ${STATUS_COLORS[ip.status]}`}
                          />
                          <span className="flex-1 truncate">{ip.item.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {ip.item.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
