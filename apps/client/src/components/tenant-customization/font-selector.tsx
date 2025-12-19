import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { loadGoogleFont } from "@/hooks/use-custom-theme";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";
import { Label } from "@learnbase/ui";
import { GOOGLE_FONTS, ALL_FONTS } from "./fonts-data";

type FontSelectorProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  previewText?: string;
};

export function FontSelector({
  label,
  value,
  onChange,
  previewText,
}: FontSelectorProps) {
  const { t } = useTranslation();

  const isCustomFont = useMemo(() => {
    if (!value) return false;
    return !ALL_FONTS.some((font) => font.name === value);
  }, [value]);

  useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  useEffect(() => {
    GOOGLE_FONTS.sans.slice(0, 5).forEach((font) => loadGoogleFont(font.name));
    GOOGLE_FONTS.serif.slice(0, 3).forEach((font) => loadGoogleFont(font.name));
    GOOGLE_FONTS.display
      .slice(0, 3)
      .forEach((font) => loadGoogleFont(font.name));
  }, []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue
            placeholder={t(
              "dashboard.site.customization.appearance.selectFont"
            )}
          />
        </SelectTrigger>
        <SelectContent>
          {isCustomFont && value && (
            <SelectGroup>
              <SelectLabel>
                {t(
                  "dashboard.site.customization.appearance.fontCategories.current"
                )}
              </SelectLabel>
              <SelectItem value={value}>
                <span style={{ fontFamily: `"${value}", sans-serif` }}>
                  {value}
                </span>
              </SelectItem>
            </SelectGroup>
          )}
          <SelectGroup>
            <SelectLabel>
              {t("dashboard.site.customization.appearance.fontCategories.sans")}
            </SelectLabel>
            {GOOGLE_FONTS.sans.map((font) => (
              <SelectItem key={font.name} value={font.name}>
                <span style={{ fontFamily: `"${font.name}", sans-serif` }}>
                  {font.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>
              {t(
                "dashboard.site.customization.appearance.fontCategories.serif"
              )}
            </SelectLabel>
            {GOOGLE_FONTS.serif.map((font) => (
              <SelectItem key={font.name} value={font.name}>
                <span style={{ fontFamily: `"${font.name}", serif` }}>
                  {font.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>
              {t(
                "dashboard.site.customization.appearance.fontCategories.display"
              )}
            </SelectLabel>
            {GOOGLE_FONTS.display.map((font) => (
              <SelectItem key={font.name} value={font.name}>
                <span style={{ fontFamily: `"${font.name}", sans-serif` }}>
                  {font.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {value && previewText && (
        <p
          className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md"
          style={{ fontFamily: `"${value}", sans-serif` }}
        >
          {previewText}
        </p>
      )}
    </div>
  );
}
