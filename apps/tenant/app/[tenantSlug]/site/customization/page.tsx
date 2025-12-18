"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTenantCustomization,
  useUpdateTenantCustomization,
} from "@/services/tenant";

const customizationSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  fontFamily: z.string(),
  borderRadius: z.string(),
});

type CustomizationFormData = z.infer<typeof customizationSchema>;

const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "opensans", label: "Open Sans" },
  { value: "poppins", label: "Poppins" },
  { value: "lato", label: "Lato" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (4px)" },
  { value: "md", label: "Medium (8px)" },
  { value: "lg", label: "Large (12px)" },
  { value: "xl", label: "Extra Large (16px)" },
];

export default function CustomizationPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useTenantCustomization();
  const updateMutation = useUpdateTenantCustomization();

  const form = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      primaryColor: "#3B82F6",
      secondaryColor: "#6B7280",
      accentColor: "#10B981",
      fontFamily: "inter",
      borderRadius: "md",
    },
  });

  useEffect(() => {
    if (data?.customization) {
      form.reset({
        primaryColor: data.customization.primaryColor,
        secondaryColor: data.customization.secondaryColor,
        accentColor: data.customization.accentColor,
        fontFamily: data.customization.fontFamily,
        borderRadius: data.customization.borderRadius,
      });
    }
  }, [data, form]);

  const handleSubmit = (values: CustomizationFormData) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return <CustomizationSkeleton />;
  }

  const primaryColor = form.watch("primaryColor");
  const secondaryColor = form.watch("secondaryColor");
  const accentColor = form.watch("accentColor");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("site.customization.title")}</h1>
        <p className="text-muted-foreground">{t("site.customization.description")}</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium">{t("site.customization.colors")}</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t("site.customization.primaryColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  {...form.register("primaryColor")}
                  className="flex-1"
                />
                <div
                  className="size-10 rounded-md border border-border"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              {form.formState.errors.primaryColor && (
                <p className="text-sm text-destructive">{form.formState.errors.primaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">{t("site.customization.secondaryColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  {...form.register("secondaryColor")}
                  className="flex-1"
                />
                <div
                  className="size-10 rounded-md border border-border"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
              {form.formState.errors.secondaryColor && (
                <p className="text-sm text-destructive">{form.formState.errors.secondaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">{t("site.customization.accentColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  {...form.register("accentColor")}
                  className="flex-1"
                />
                <div
                  className="size-10 rounded-md border border-border"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
              {form.formState.errors.accentColor && (
                <p className="text-sm text-destructive">{form.formState.errors.accentColor.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium">{t("site.customization.typography")}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("site.customization.fontFamily")}</Label>
              <Controller
                name="fontFamily"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("site.customization.borderRadius")}</Label>
              <Controller
                name="borderRadius"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BORDER_RADIUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </form>
    </div>
  );
}

function CustomizationSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
