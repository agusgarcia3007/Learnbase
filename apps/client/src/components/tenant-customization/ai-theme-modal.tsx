import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Color from "color";
import { Sparkles, Palette, Sun, Moon, Search, Star, TrendingUp, Zap } from "lucide-react";
import { loadGoogleFont } from "@/hooks/use-custom-theme";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@learnbase/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerFormat,
  ColorPickerOutput,
  ColorPickerEyeDropper,
} from "@/components/kibo-ui/color-picker";
import { useGenerateTheme, type GeneratedTheme } from "@/services/ai";

type AiThemeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (theme: GeneratedTheme) => void;
};

export function AiThemeModal({ open, onOpenChange, onApply }: AiThemeModalProps) {
  const { t } = useTranslation();
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const { mutate: generateTheme, isPending } = useGenerateTheme();

  useEffect(() => {
    if (generatedTheme?.fontHeading) {
      loadGoogleFont(generatedTheme.fontHeading);
    }
    if (generatedTheme?.fontBody && generatedTheme.fontBody !== generatedTheme.fontHeading) {
      loadGoogleFont(generatedTheme.fontBody);
    }
  }, [generatedTheme]);

  const handleColorChange = useCallback((rgba: Parameters<typeof Color.rgb>[0]) => {
    if (Array.isArray(rgba)) {
      const hex = Color.rgb(rgba[0], rgba[1], rgba[2]).hex();
      setPrimaryColor(hex);
    }
  }, []);

  const handleGenerate = () => {
    generateTheme(
      {
        primaryColor: primaryColor || undefined,
        style: style || undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedTheme(data.theme);
        },
      }
    );
  };

  const handleApply = () => {
    if (generatedTheme) {
      onApply(generatedTheme);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrimaryColor("");
    setStyle("");
    setGeneratedTheme(null);
    setPreviewMode("light");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {isPending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/90 backdrop-blur-sm">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-1/2 animate-[shimmer-slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
            <p className="text-sm font-medium text-primary">
              {t("dashboard.site.customization.appearance.aiModal.generating")}
            </p>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t("dashboard.site.customization.appearance.aiModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.site.customization.appearance.aiModal.description")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="overflow-y-auto">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dashboard.site.customization.appearance.aiModal.primaryColor")}</Label>
                <div className="flex gap-2">
                  <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-12 h-9 p-1"
                        style={{ backgroundColor: primaryColor || undefined }}
                      >
                        {!primaryColor && <Palette className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <ColorPicker
                        value={primaryColor || "#6366f1"}
                        onChange={handleColorChange}
                        className="gap-3"
                      >
                        <ColorPickerSelection className="h-32" />
                        <ColorPickerHue />
                        <div className="flex items-center gap-2">
                          <ColorPickerEyeDropper />
                          <ColorPickerOutput />
                          <ColorPickerFormat className="flex-1" />
                        </div>
                      </ColorPicker>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.site.customization.appearance.aiModal.primaryColorHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("dashboard.site.customization.appearance.aiModal.style")}</Label>
                <Input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder={t("dashboard.site.customization.appearance.aiModal.stylePlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.site.customization.appearance.aiModal.styleHelp")}
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isPending}
                isLoading={isPending}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("dashboard.site.customization.appearance.aiModal.generate")}
              </Button>

              {primaryColor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrimaryColor("")}
                  className="w-full"
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("dashboard.site.customization.appearance.aiModal.preview")}</Label>
                {generatedTheme && (
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("light")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        previewMode === "light"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      {t("dashboard.site.customization.appearance.aiModal.lightMode")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("dark")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        previewMode === "dark"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      {t("dashboard.site.customization.appearance.aiModal.darkMode")}
                    </button>
                  </div>
                )}
              </div>

              {generatedTheme ? (
                <ThemePreview theme={generatedTheme} mode={previewMode} />
              ) : (
                <div className="flex h-80 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
                  <div className="text-center">
                    <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("dashboard.site.customization.appearance.aiModal.previewEmpty")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleApply} disabled={!generatedTheme}>
            {t("dashboard.site.customization.appearance.aiModal.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThemePreview({ theme, mode }: { theme: GeneratedTheme; mode: "light" | "dark" }) {
  const { t } = useTranslation();

  const c = <K extends keyof GeneratedTheme>(lightKey: K, darkKey: K): string => {
    const value = mode === "dark" ? theme[darkKey] : theme[lightKey];
    return (value as string) || "";
  };

  return (
    <div
      className="overflow-hidden border"
      style={{
        borderRadius: theme.radius,
        backgroundColor: c("background", "backgroundDark"),
        color: c("foreground", "foregroundDark"),
        fontFamily: `"${theme.fontBody}", ui-sans-serif, system-ui, sans-serif`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: c("primary", "primaryDark") }}
      >
        <span
          className="text-sm font-semibold"
          style={{
            color: c("primaryForeground", "primaryForegroundDark"),
            fontFamily: `"${theme.fontHeading}", sans-serif`,
          }}
        >
          {t("dashboard.site.customization.appearance.aiModal.previewLanding")}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5"
            style={{
              backgroundColor: c("accent", "accentDark"),
              color: c("accentForeground", "accentForegroundDark"),
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewBadge")}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center space-y-2 py-3">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: `"${theme.fontHeading}", sans-serif` }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewHero")}
          </h2>
          <p
            className="text-sm"
            style={{ color: c("mutedForeground", "mutedForegroundDark") }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewMuted")}
          </p>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            backgroundColor: c("muted", "mutedDark"),
            borderRadius: theme.radius,
          }}
        >
          <Search className="h-4 w-4" style={{ color: c("mutedForeground", "mutedForegroundDark") }} />
          <span
            className="text-sm"
            style={{ color: c("mutedForeground", "mutedForegroundDark") }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewInput")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Star, label: "previewCard1" },
            { icon: TrendingUp, label: "previewCard2" },
            { icon: Zap, label: "previewCard3" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="p-3 space-y-2"
              style={{
                backgroundColor: c("card", "cardDark"),
                borderRadius: theme.radius,
                border: `1px solid ${c("border", "borderDark")}`,
                boxShadow: c("shadow", "shadowDark"),
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: c("primary", "primaryDark") }}
              >
                <Icon className="h-3 w-3" style={{ color: c("primaryForeground", "primaryForegroundDark") }} />
              </div>
              <p
                className="text-xs font-medium"
                style={{
                  color: c("cardForeground", "cardForegroundDark"),
                  fontFamily: `"${theme.fontHeading}", sans-serif`,
                }}
              >
                {t(`dashboard.site.customization.appearance.aiModal.${label}`)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: c("primary", "primaryDark"),
              color: c("primaryForeground", "primaryForegroundDark"),
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewButton")}
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: c("secondary", "secondaryDark"),
              color: c("secondaryForeground", "secondaryForegroundDark"),
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewOutline")}
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: c("destructive", "destructiveDark"),
              color: c("destructiveForeground", "destructiveForegroundDark"),
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewDestructive")}
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium border"
            style={{
              borderColor: c("border", "borderDark"),
              color: c("foreground", "foregroundDark"),
              borderRadius: theme.radius,
              backgroundColor: "transparent",
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewGhost")}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: c("mutedForeground", "mutedForegroundDark") }}>
            {t("dashboard.site.customization.appearance.aiModal.previewCharts")}
          </p>
          <div className="flex items-end gap-1 h-10">
            <div
              className="flex-1 rounded-t"
              style={{ backgroundColor: c("chart1", "chart1Dark"), height: "80%" }}
            />
            <div
              className="flex-1 rounded-t"
              style={{ backgroundColor: c("chart2", "chart2Dark"), height: "60%" }}
            />
            <div
              className="flex-1 rounded-t"
              style={{ backgroundColor: c("chart3", "chart3Dark"), height: "90%" }}
            />
            <div
              className="flex-1 rounded-t"
              style={{ backgroundColor: c("chart4", "chart4Dark"), height: "45%" }}
            />
            <div
              className="flex-1 rounded-t"
              style={{ backgroundColor: c("chart5", "chart5Dark"), height: "70%" }}
            />
          </div>
        </div>

        <div
          className="flex items-center gap-3 p-3 mt-2"
          style={{
            backgroundColor: c("sidebar", "sidebarDark"),
            borderRadius: theme.radius,
            border: `1px solid ${c("sidebarBorder", "sidebarBorderDark")}`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: c("sidebarPrimary", "sidebarPrimaryDark") }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: c("sidebarPrimaryForeground", "sidebarPrimaryForegroundDark") }}
            />
          </div>
          <div className="flex-1">
            <p
              className="text-xs font-medium"
              style={{ color: c("sidebarForeground", "sidebarForegroundDark") }}
            >
              {t("dashboard.site.customization.appearance.aiModal.previewSidebar")}
            </p>
            <p
              className="text-xs"
              style={{ color: c("sidebarAccentForeground", "sidebarAccentForegroundDark") }}
            >
              {t("dashboard.site.customization.appearance.aiModal.previewSidebarSub")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
