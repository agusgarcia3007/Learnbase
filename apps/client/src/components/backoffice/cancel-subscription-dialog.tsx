import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { Button } from "@learnbase/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useCancelSubscription,
  type BackofficeSubscription,
} from "@/services/backoffice-subscriptions";

type CancelSubscriptionDialogProps = {
  subscription: BackofficeSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: CancelSubscriptionDialogProps) {
  const { t } = useTranslation();
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const cancelMutation = useCancelSubscription();

  const handleSubmit = () => {
    if (!subscription) return;
    cancelMutation.mutate(
      { tenantId: subscription.id, cancelImmediately },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCancelImmediately(false);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCancelImmediately(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t("backoffice.subscriptions.cancel.title")}
          </DialogTitle>
          <DialogDescription>
            {t("backoffice.subscriptions.cancel.description", {
              tenant: subscription?.tenantName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              {t("backoffice.subscriptions.cancel.warning")}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="cancelImmediately"
              checked={cancelImmediately}
              onCheckedChange={(checked) => setCancelImmediately(checked === true)}
              disabled={cancelMutation.isPending}
            />
            <Label htmlFor="cancelImmediately" className="text-sm">
              {t("backoffice.subscriptions.cancel.immediate")}
            </Label>
          </div>

          <p className="text-xs text-muted-foreground">
            {cancelImmediately
              ? t("backoffice.subscriptions.cancel.immediateHelp")
              : t("backoffice.subscriptions.cancel.endOfPeriodHelp")}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            isLoading={cancelMutation.isPending}
          >
            {t("backoffice.subscriptions.cancel.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
