import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";
import { Sparkles, Sun, Moon, ImageIcon, Upload, X, Loader2 } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@learnbase/ui";
import { Image } from "@/components/ui/image";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import { ThemeSelector } from "@/components/tenant-configuration/theme-selector";
import { THEME_PRESETS } from "@/components/tenant-configuration/schema";
import { ModeSelector } from "../mode-selector";
import { SaveButton } from "../save-button";
import { AiThemeModal } from "../ai-theme-modal";
import { ThemePreview } from "../theme-preview";
import { FontSelector } from "../font-selector";
import { loadGoogleFont } from "@/hooks/use-custom-theme";
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
  onLogoUpload: (file: File) => Promise<string>;
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
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);
        const url = await onLogoUpload(file);
        onLogoChange(url);
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
      }
    },
    [onLogoUpload, onLogoChange]
  );

  const [
    { isDragging, errors: logoErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const handleLogoDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onLogoDelete();
    onLogoChange(null);
  };

  const isLogoLoading = isUploadingLogo || isDeletingLogo;
  const displayLogo = localPreview || logoUrl;

  const handleThemeChange = (theme: CustomizationFormData["theme"]) => {
    form.setValue("theme", theme);
  };

  const handleApplyAiTheme = (theme: GeneratedTheme) => {
    form.setValue("customTheme", theme);
    form.setValue("theme", null);
  };

  const handleRestoreCustomTheme = () => {
    form.setValue("theme", null);
  };

  const customTheme = useWatch({ control: form.control, name: "customTheme" });
  const selectedTheme = useWatch({ control: form.control, name: "theme" });

  const isCustomThemeActive = customTheme && !selectedTheme;
  const activePreviewTheme = isCustomThemeActive
    ? customTheme
    : selectedTheme
      ? THEME_PRESETS[selectedTheme]
      : THEME_PRESETS.default;

  useEffect(() => {
    Object.values(THEME_PRESETS).forEach((preset) => {
      if (preset.fontHeading) loadGoogleFont(preset.fontHeading);
      if (preset.fontBody && preset.fontBody !== preset.fontHeading) {
        loadGoogleFont(preset.fontBody);
      }
    });
  }, []);

  return (
    <TabsContent value="appearance" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t("dashboard.site.customization.appearance.logo")}
          </p>
          {displayLogo ? (
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={displayLogo}
                  alt="Logo"
                  layout="fullWidth"
                  className="h-full w-full object-cover"
                />
                {isLogoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {!isLogoLoading && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleLogoDelete}
                  className="absolute -right-2 -top-2 size-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  isLogoLoading && "pointer-events-none opacity-50"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                <input {...getInputProps()} className="sr-only" disabled={isLogoLoading} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  {isLogoLoading ? (
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="rounded-full bg-muted p-3">
                        {isDragging ? (
                          <Upload className="size-6 text-primary" />
                        ) : (
                          <ImageIcon className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {isDragging ? t("common.dropHere") : t("common.dragOrClick")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("common.maxFileSize", { size: formatBytes(2 * 1024 * 1024) })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {logoErrors.length > 0 && (
                <p className="text-sm text-destructive">{logoErrors[0]}</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t("dashboard.site.customization.appearance.logoAndFaviconHelp")}
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
                    <div className="flex items-start gap-4">
                      <div className="space-y-3">
                        <ThemeSelector
                          value={field.value}
                          onChange={handleThemeChange}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAiModalOpen(true)}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t("dashboard.site.customization.appearance.generateWithAI")}
                          </Button>
                          {customTheme && selectedTheme && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRestoreCustomTheme}
                            >
                              <div
                                className="h-4 w-4 rounded-full mr-2 ring-1 ring-border"
                                style={{ backgroundColor: customTheme.primary }}
                              />
                              {t("dashboard.site.customization.appearance.restoreCustomTheme")}
                            </Button>
                          )}
                          {isCustomThemeActive && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full ring-2 ring-primary ring-offset-1 ring-offset-background"
                                style={{ backgroundColor: customTheme.primary }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {t("dashboard.site.customization.appearance.customThemeActive")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:block space-y-2">
                        <div className="flex items-center gap-1 rounded-md border p-0.5">
                          <button
                            type="button"
                            onClick={() => setPreviewMode("light")}
                            className={`flex items-center justify-center rounded p-1 transition-colors ${
                              previewMode === "light"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Sun className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewMode("dark")}
                            className={`flex items-center justify-center rounded p-1 transition-colors ${
                              previewMode === "dark"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Moon className="h-3 w-3" />
                          </button>
                        </div>
                        <ThemePreview theme={activePreviewTheme} mode={previewMode} variant="compact" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                  if (!font) return;
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
                  if (!font) return;
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
