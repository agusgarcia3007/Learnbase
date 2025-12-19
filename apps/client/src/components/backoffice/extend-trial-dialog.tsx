import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useExtendTrial,
  type BackofficeSubscription,
} from "@/services/backoffice-subscriptions";

type ExtendTrialDialogProps = {
  subscription: BackofficeSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExtendTrialDialog({
  subscription,
  open,
  onOpenChange,
}: ExtendTrialDialogProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(7);
  const extendTrialMutation = useExtendTrial();

  const handleSubmit = () => {
    if (!subscription || days < 1) return;
    extendTrialMutation.mutate(
      { tenantId: subscription.id, days },
      {
        onSuccess: () => {
          onOpenChange(false);
          setDays(7);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDays(7);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("backoffice.subscriptions.extendTrial.title")}</DialogTitle>
          <DialogDescription>
            {t("backoffice.subscriptions.extendTrial.description", {
              tenant: subscription?.tenantName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {subscription?.trialEndsAt && (
            <p className="text-sm text-muted-foreground">
              {t("backoffice.subscriptions.extendTrial.currentEnd", {
                date: new Date(subscription.trialEndsAt).toLocaleDateString(),
              })}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="days">{t("backoffice.subscriptions.extendTrial.days")}</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              disabled={extendTrialMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t("backoffice.subscriptions.extendTrial.daysHelp")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={extendTrialMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={days < 1 || days > 365}
            isLoading={extendTrialMutation.isPending}
          >
            {t("backoffice.subscriptions.extendTrial.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
