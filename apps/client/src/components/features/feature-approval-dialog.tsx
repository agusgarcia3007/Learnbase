import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getAssetUrl } from "@/lib/constants";
import type { Feature } from "@/services/features";

interface FeatureApprovalDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
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

export function FeatureApprovalDialog({
  feature,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: FeatureApprovalDialogProps) {
  const { t } = useTranslation();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!feature) return null;

  const priority = priorityVariants[feature.priority];
  const isPending = isApproving || isRejecting;

  const handleApprove = () => {
    onApprove(feature.id);
  };

  const handleReject = () => {
    onReject(feature.id, rejectionReason || undefined);
    setRejectionReason("");
    setShowRejectForm(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowRejectForm(false);
      setRejectionReason("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("features.approval.title")}</DialogTitle>
          <DialogDescription>
            {t("features.approval.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium">{feature.title}</h4>
              <Badge variant={priority.variant} appearance="light" size="sm">
                {t(priority.label)}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-3 text-muted-foreground text-sm">
              {feature.description}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={getAssetUrl(feature.submittedBy.avatar)} />
                <AvatarFallback className="text-[10px]">
                  {feature.submittedBy.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
                {feature.submittedBy.name}
              </span>
            </div>
          </div>

          {showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="reason">{t("features.approval.reasonLabel")}</Label>
              <Textarea
                id="reason"
                placeholder={t("features.approval.reasonPlaceholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {showRejectForm ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {t("common.back")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                isLoading={isRejecting}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {t("features.approval.confirmReject")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {t("features.approval.reject")}
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                isLoading={isApproving}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {t("features.approval.approve")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
