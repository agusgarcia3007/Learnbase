import { useMemo, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import type { CustomTheme } from "@/services/tenants/service";

type CustomThemeStyles = React.CSSProperties & {
  "--primary"?: string;
  "--primary-foreground"?: string;
  "--secondary"?: string;
  "--secondary-foreground"?: string;
  "--accent"?: string;
  "--accent-foreground"?: string;
  "--ring"?: string;
  "--radius"?: string;
  "--font-heading"?: string;
  "--font-body"?: string;
  "--shadow"?: string;
  "--shadow-lg"?: string;
};

export function loadGoogleFont(fontFamily: string) {
  if (typeof window === "undefined") return;

  const fontId = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function useCustomTheme(customTheme: CustomTheme | null | undefined) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!customTheme) return;

    if (customTheme.fontHeading) {
      loadGoogleFont(customTheme.fontHeading);
    }
    if (customTheme.fontBody && customTheme.fontBody !== customTheme.fontHeading) {
      loadGoogleFont(customTheme.fontBody);
    }
  }, [customTheme?.fontHeading, customTheme?.fontBody]);

  const customStyles = useMemo<CustomThemeStyles | undefined>(() => {
    if (!customTheme) return undefined;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    return {
      "--primary": isDark ? customTheme.primaryDark : customTheme.primary,
      "--primary-foreground": isDark
        ? customTheme.primaryForegroundDark
        : customTheme.primaryForeground,
      "--secondary": isDark ? customTheme.secondaryDark : customTheme.secondary,
      "--secondary-foreground": isDark
        ? customTheme.secondaryForegroundDark
        : customTheme.secondaryForeground,
      "--accent": isDark ? customTheme.accentDark : customTheme.accent,
      "--accent-foreground": isDark
        ? customTheme.accentForegroundDark
        : customTheme.accentForeground,
      "--ring": isDark ? customTheme.ringDark : customTheme.ring,
      "--radius": customTheme.radius,
      "--font-heading": customTheme.fontHeading
        ? `"${customTheme.fontHeading}", sans-serif`
        : undefined,
      "--font-body": customTheme.fontBody
        ? `"${customTheme.fontBody}", sans-serif`
        : undefined,
      "--shadow": customTheme.shadow,
      "--shadow-lg": customTheme.shadowLg,
    };
  }, [customTheme, theme]);

  return { customStyles };
}
