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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useChangePlan,
  type BackofficeSubscription,
  type TenantPlan,
} from "@/services/backoffice-subscriptions";

type ChangePlanDialogProps = {
  subscription: BackofficeSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePlanDialog({
  subscription,
  open,
  onOpenChange,
}: ChangePlanDialogProps) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan | "">("");
  const changePlanMutation = useChangePlan();

  const handleSubmit = () => {
    if (!subscription || !selectedPlan) return;
    changePlanMutation.mutate(
      { tenantId: subscription.id, plan: selectedPlan },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedPlan("");
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlan("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("backoffice.subscriptions.changePlan.title")}</DialogTitle>
          <DialogDescription>
            {t("backoffice.subscriptions.changePlan.description", {
              tenant: subscription?.tenantName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t("backoffice.subscriptions.changePlan.currentPlan", {
              plan: subscription?.plan
                ? t(`backoffice.subscriptions.plans.${subscription.plan}`)
                : t("backoffice.subscriptions.noPlan"),
            })}
          </p>

          <div className="space-y-2">
            <Label>{t("backoffice.subscriptions.changePlan.selectPlan")}</Label>
            <Select
              value={selectedPlan}
              onValueChange={(value: TenantPlan) => setSelectedPlan(value)}
              disabled={changePlanMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("backoffice.subscriptions.changePlan.selectPlan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter" disabled={subscription?.plan === "starter"}>
                  {t("backoffice.subscriptions.plans.starter")} - $49/mo
                </SelectItem>
                <SelectItem value="growth" disabled={subscription?.plan === "growth"}>
                  {t("backoffice.subscriptions.plans.growth")} - $99/mo
                </SelectItem>
                <SelectItem value="scale" disabled={subscription?.plan === "scale"}>
                  {t("backoffice.subscriptions.plans.scale")} - $349/mo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={changePlanMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlan || selectedPlan === subscription?.plan}
            isLoading={changePlanMutation.isPending}
          >
            {t("backoffice.subscriptions.changePlan.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
