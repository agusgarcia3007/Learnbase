import { useState, useEffect } from "react";
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
  useUpdateCommissionRate,
  type BackofficeSubscription,
} from "@/services/backoffice-subscriptions";

type UpdateCommissionDialogProps = {
  subscription: BackofficeSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateCommissionDialog({
  subscription,
  open,
  onOpenChange,
}: UpdateCommissionDialogProps) {
  const { t } = useTranslation();
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const updateCommissionMutation = useUpdateCommissionRate();

  useEffect(() => {
    if (subscription) {
      setCommissionRate(subscription.commissionRate);
    }
  }, [subscription]);

  const handleSubmit = () => {
    if (!subscription || commissionRate < 0 || commissionRate > 100) return;
    updateCommissionMutation.mutate(
      { tenantId: subscription.id, commissionRate },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && subscription) {
      setCommissionRate(subscription.commissionRate);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("backoffice.subscriptions.updateCommission.title")}</DialogTitle>
          <DialogDescription>
            {t("backoffice.subscriptions.updateCommission.description", {
              tenant: subscription?.tenantName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t("backoffice.subscriptions.updateCommission.currentRate", {
              rate: subscription?.commissionRate,
            })}
          </p>

          <div className="space-y-2">
            <Label htmlFor="commissionRate">
              {t("backoffice.subscriptions.updateCommission.newRate")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="commissionRate"
                type="number"
                min={0}
                max={100}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                disabled={updateCommissionMutation.isPending}
                className="max-w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("backoffice.subscriptions.updateCommission.rateHelp")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateCommissionMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={commissionRate < 0 || commissionRate > 100}
            isLoading={updateCommissionMutation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
