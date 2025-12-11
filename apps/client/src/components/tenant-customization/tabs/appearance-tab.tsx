import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { Sparkles } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/file-upload/image-upload";

import { ThemeSelector } from "@/components/tenant-configuration/theme-selector";
import { ModeSelector } from "../mode-selector";
import { SaveButton } from "../save-button";
import { AiThemeModal } from "../ai-theme-modal";
import { FontSelector } from "../font-selector";
import type { CustomizationFormData } from "../schema";
import type { GeneratedTheme } from "@/services/ai";
import type { CustomTheme } from "@/services/tenants/service";

function createPartialTheme(overrides: Partial<CustomTheme>): CustomTheme {
  return {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.141 0.005 285.823)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.141 0.005 285.823)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.141 0.005 285.823)",
    primary: "oklch(0.48 0.2 260)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.967 0.001 286.375)",
    secondaryForeground: "oklch(0.21 0.006 285.885)",
    muted: "oklch(0.967 0.001 286.375)",
    mutedForeground: "oklch(0.552 0.016 285.938)",
    accent: "oklch(0.967 0.001 286.375)",
    accentForeground: "oklch(0.21 0.006 285.885)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(1 0 0)",
    border: "oklch(0.92 0.004 286.32)",
    input: "oklch(0.92 0.004 286.32)",
    ring: "oklch(0.475 0.17 255)",
    chart1: "oklch(0.75 0.12 255)",
    chart2: "oklch(0.65 0.16 255)",
    chart3: "oklch(0.55 0.17 255)",
    chart4: "oklch(0.475 0.17 255)",
    chart5: "oklch(0.38 0.15 255)",
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.141 0.005 285.823)",
    sidebarPrimary: "oklch(0.448 0.213 264.05)",
    sidebarPrimaryForeground: "oklch(1 0 0)",
    sidebarAccent: "oklch(0.967 0.001 286.375)",
    sidebarAccentForeground: "oklch(0.21 0.006 285.885)",
    sidebarBorder: "oklch(0.92 0.004 286.32)",
    sidebarRing: "oklch(0.708 0 0)",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    radius: "0.65rem",
    backgroundDark: "oklch(0.141 0.005 285.823)",
    foregroundDark: "oklch(0.985 0 0)",
    cardDark: "oklch(0.21 0.006 285.885)",
    cardForegroundDark: "oklch(0.985 0 0)",
    popoverDark: "oklch(0.21 0.006 285.885)",
    popoverForegroundDark: "oklch(0.985 0 0)",
    primaryDark: "oklch(0.6 0.16 255)",
    primaryForegroundDark: "oklch(1 0 0)",
    secondaryDark: "oklch(0.274 0.006 286.033)",
    secondaryForegroundDark: "oklch(0.985 0 0)",
    mutedDark: "oklch(0.274 0.006 286.033)",
    mutedForegroundDark: "oklch(0.705 0.015 286.067)",
    accentDark: "oklch(0.274 0.006 286.033)",
    accentForegroundDark: "oklch(0.985 0 0)",
    destructiveDark: "oklch(0.704 0.191 22.216)",
    destructiveForegroundDark: "oklch(1 0 0)",
    borderDark: "oklch(1 0 0 / 10%)",
    inputDark: "oklch(1 0 0 / 15%)",
    ringDark: "oklch(0.6 0.16 255)",
    chart1Dark: "oklch(0.75 0.12 255)",
    chart2Dark: "oklch(0.65 0.16 255)",
    chart3Dark: "oklch(0.55 0.17 255)",
    chart4Dark: "oklch(0.475 0.17 255)",
    chart5Dark: "oklch(0.38 0.15 255)",
    sidebarDark: "oklch(0.21 0.006 285.885)",
    sidebarForegroundDark: "oklch(0.985 0 0)",
    sidebarPrimaryDark: "oklch(0.55 0.19 264)",
    sidebarPrimaryForegroundDark: "oklch(1 0 0)",
    sidebarAccentDark: "oklch(0.274 0.006 286.033)",
    sidebarAccentForegroundDark: "oklch(0.985 0 0)",
    sidebarBorderDark: "oklch(1 0 0 / 10%)",
    sidebarRingDark: "oklch(0.439 0 0)",
    shadowDark: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
    shadowLgDark: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
    fontHeading: "Inter",
    fontBody: "Inter",
    ...overrides,
  };
}

type AppearanceTabProps = {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  onLogoUpload: (base64: string) => Promise<string>;
  onLogoDelete: () => Promise<void>;
  isUploadingLogo: boolean;
  isDeletingLogo: boolean;
  isSaving: boolean;
};

export function AppearanceTab({
  logoUrl,
  onLogoChange,
  onLogoUpload,
  onLogoDelete,
  isUploadingLogo,
  isDeletingLogo,
  isSaving,
}: AppearanceTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<CustomizationFormData>();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleThemeChange = (theme: CustomizationFormData["theme"]) => {
    form.setValue("theme", theme);
    form.setValue("customTheme", null);
  };

  const handleApplyAiTheme = (theme: GeneratedTheme) => {
    form.setValue("customTheme", theme);
    form.setValue("theme", null);
  };

  const customTheme = form.watch("customTheme");

  return (
    <TabsContent value="appearance" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t("dashboard.site.customization.appearance.logo")}
          </p>
          <ImageUpload
            value={logoUrl}
            onChange={onLogoChange}
            onUpload={onLogoUpload}
            onDelete={onLogoDelete}
            aspectRatio="1/1"
            maxSize={2 * 1024 * 1024}
            isUploading={isUploadingLogo}
            isDeleting={isDeletingLogo}
          />
          <p className="text-xs text-muted-foreground">
            {t("dashboard.site.customization.appearance.logoHelp")}
          </p>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="space-y-4 p-5">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.site.customization.appearance.theme")}
                  </FormLabel>
                  <FormControl>
                    <ThemeSelector
                      value={field.value}
                      onChange={handleThemeChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAiModalOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("dashboard.site.customization.appearance.generateWithAI")}
              </Button>
              {customTheme && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-primary"
                    style={{ backgroundColor: customTheme.primary }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.site.customization.appearance.customThemeActive")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          <div className="space-y-4 p-5">
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.site.customization.appearance.mode")}
                  </FormLabel>
                  <FormControl>
                    <ModeSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t" />

          <div className="p-5">
            <FormField
              control={form.control}
              name="showHeaderName"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="font-normal">
                    {t("dashboard.site.customization.appearance.showHeaderName")}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="border-t" />

          <div className="space-y-4 p-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.site.customization.appearance.typography")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.site.customization.appearance.typographyHelp")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FontSelector
                label={t("dashboard.site.customization.appearance.fontHeading")}
                value={customTheme?.fontHeading}
                onChange={(font) => {
                  const current = form.getValues("customTheme");
                  if (current) {
                    form.setValue("customTheme", { ...current, fontHeading: font });
                  } else {
                    form.setValue("customTheme", createPartialTheme({ fontHeading: font }));
                    form.setValue("theme", null);
                  }
                }}
                previewText={t("dashboard.site.customization.appearance.headingPreview")}
              />

              <FontSelector
                label={t("dashboard.site.customization.appearance.fontBody")}
                value={customTheme?.fontBody}
                onChange={(font) => {
                  const current = form.getValues("customTheme");
                  if (current) {
                    form.setValue("customTheme", { ...current, fontBody: font });
                  } else {
                    form.setValue("customTheme", createPartialTheme({ fontBody: font }));
                    form.setValue("theme", null);
                  }
                }}
                previewText={t("dashboard.site.customization.appearance.bodyPreview")}
              />
            </div>
          </div>
        </div>
      </div>

      <SaveButton isLoading={isSaving} />

      <AiThemeModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApply={handleApplyAiTheme}
      />
    </TabsContent>
  );
}
