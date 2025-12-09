import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Color from "color";
import { Sparkles, Palette } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

  const { mutate: generateTheme, isPending } = useGenerateTheme();

  useEffect(() => {
    if (generatedTheme?.fontHeading) {
      loadGoogleFont(generatedTheme.fontHeading);
    }
    if (generatedTheme?.fontBody && generatedTheme.fontBody !== generatedTheme.fontHeading) {
      loadGoogleFont(generatedTheme.fontBody);
    }
  }, [generatedTheme]);

  const handleColorChange = useCallback((rgba: [number, number, number, number]) => {
    const hex = Color.rgb(rgba[0], rgba[1], rgba[2]).hex();
    setPrimaryColor(hex);
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
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

        <DialogBody className="space-y-4">
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
              {primaryColor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrimaryColor("")}
                >
                  {t("common.clear")}
                </Button>
              )}
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

          {generatedTheme && (
            <div className="space-y-2 pt-2">
              <Label>{t("dashboard.site.customization.appearance.aiModal.preview")}</Label>
              <ThemePreview theme={generatedTheme} />
            </div>
          )}
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

function ThemePreview({ theme }: { theme: GeneratedTheme }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden border" style={{ borderRadius: theme.radius }}>
      <div
        className="h-10 flex items-center justify-between px-3"
        style={{ backgroundColor: theme.primary, borderRadius: `${theme.radius} ${theme.radius} 0 0` }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: theme.primaryForeground, fontFamily: theme.fontHeading }}
        >
          {t("dashboard.site.customization.appearance.aiModal.previewHeader")}
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: theme.accent,
            color: theme.accentForeground,
            borderRadius: theme.radius,
          }}
        >
          {t("dashboard.site.customization.appearance.aiModal.previewBadge")}
        </span>
      </div>
      <div
        className="p-4 space-y-3"
        style={{ backgroundColor: theme.secondary, boxShadow: theme.shadow }}
      >
        <p
          className="text-sm"
          style={{ color: theme.secondaryForeground, fontFamily: theme.fontBody }}
        >
          {t("dashboard.site.customization.appearance.aiModal.previewCardText")}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: theme.primary,
              color: theme.primaryForeground,
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewButton")}
          </button>
          <button
            className="px-3 py-1.5 text-sm font-medium border"
            style={{
              borderColor: theme.primary,
              color: theme.primary,
              borderRadius: theme.radius,
            }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewOutline")}
          </button>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <div
            className="w-3 h-3"
            style={{ backgroundColor: theme.accent, borderRadius: theme.radius }}
          />
          <span
            className="text-xs"
            style={{ color: theme.secondaryForeground, fontFamily: theme.fontBody }}
          >
            {t("dashboard.site.customization.appearance.aiModal.previewText")}
          </span>
        </div>
      </div>
    </div>
  );
}
