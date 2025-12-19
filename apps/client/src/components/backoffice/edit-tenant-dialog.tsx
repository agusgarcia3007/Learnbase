import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tenant, TenantStatus } from "@/services/tenants/service";

const schema = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "suspended", "cancelled"]),
  maxUsers: z.number().nullable(),
  maxCourses: z.number().nullable(),
  maxStorageBytes: z.string().nullable(),
  features: z.object({
    analytics: z.boolean().optional(),
    certificates: z.boolean().optional(),
    customDomain: z.boolean().optional(),
    aiAnalysis: z.boolean().optional(),
    whiteLabel: z.boolean().optional(),
  }).nullable(),
});

type FormData = z.infer<typeof schema>;

type EditTenantDialogProps = {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  isPending?: boolean;
};

export function EditTenantDialog({
  tenant,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EditTenantDialogProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      status: "active",
      maxUsers: null,
      maxCourses: null,
      maxStorageBytes: null,
      features: null,
    },
  });

  const features = watch("features");

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        status: tenant.status,
        maxUsers: tenant.maxUsers,
        maxCourses: tenant.maxCourses,
        maxStorageBytes: tenant.maxStorageBytes,
        features: tenant.features,
      });
    }
  }, [tenant, reset]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  const handleFeatureToggle = (feature: keyof NonNullable<FormData["features"]>, value: boolean) => {
    const currentFeatures = features || {};
    setValue("features", { ...currentFeatures, [feature]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("backoffice.tenants.edit.title")}</DialogTitle>
          <DialogDescription>{tenant?.slug}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                {t("backoffice.tenants.tabs.basic")}
              </TabsTrigger>
              <TabsTrigger value="limits">
                {t("backoffice.tenants.tabs.limits")}
              </TabsTrigger>
              <TabsTrigger value="features">
                {t("backoffice.tenants.tabs.features")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input
                  id="name"
                  {...register("name")}
                  disabled={isPending}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t("backoffice.tenants.columns.status")}</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value: TenantStatus) => field.onChange(value)}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {t("backoffice.tenants.status.active")}
                        </SelectItem>
                        <SelectItem value="suspended">
                          {t("backoffice.tenants.status.suspended")}
                        </SelectItem>
                        <SelectItem value="cancelled">
                          {t("backoffice.tenants.status.cancelled")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">{t("backoffice.tenants.limits.maxUsers")}</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  placeholder={t("backoffice.tenants.limits.unlimited")}
                  {...register("maxUsers", {
                    setValueAs: (v) => v === "" ? null : Number(v)
                  })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {t("backoffice.tenants.limits.maxUsersHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCourses">{t("backoffice.tenants.limits.maxCourses")}</Label>
                <Input
                  id="maxCourses"
                  type="number"
                  placeholder={t("backoffice.tenants.limits.unlimited")}
                  {...register("maxCourses", {
                    setValueAs: (v) => v === "" ? null : Number(v)
                  })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {t("backoffice.tenants.limits.maxCoursesHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStorageBytes">{t("backoffice.tenants.limits.maxStorage")}</Label>
                <Input
                  id="maxStorageBytes"
                  placeholder={t("backoffice.tenants.limits.unlimited")}
                  {...register("maxStorageBytes")}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {t("backoffice.tenants.limits.maxStorageHelp")}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("backoffice.tenants.features.analytics")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.tenants.features.analyticsHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={features?.analytics ?? false}
                    onCheckedChange={(checked) => handleFeatureToggle("analytics", checked)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("backoffice.tenants.features.certificates")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.tenants.features.certificatesHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={features?.certificates ?? false}
                    onCheckedChange={(checked) => handleFeatureToggle("certificates", checked)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("backoffice.tenants.features.customDomain")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.tenants.features.customDomainHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={features?.customDomain ?? false}
                    onCheckedChange={(checked) => handleFeatureToggle("customDomain", checked)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("backoffice.tenants.features.aiAnalysis")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.tenants.features.aiAnalysisHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={features?.aiAnalysis ?? false}
                    onCheckedChange={(checked) => handleFeatureToggle("aiAnalysis", checked)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("backoffice.tenants.features.whiteLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.tenants.features.whiteLabelHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={features?.whiteLabel ?? false}
                    onCheckedChange={(checked) => handleFeatureToggle("whiteLabel", checked)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
