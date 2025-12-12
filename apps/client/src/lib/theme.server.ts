import type { CustomTheme, TenantMode } from "@/services/tenants/service";

export type CustomThemeStyles = React.CSSProperties & Record<string, string | undefined>;

export function computeCustomStyles(
  customTheme: CustomTheme | null | undefined,
  mode: TenantMode | null
): CustomThemeStyles | undefined {
  if (!customTheme) return undefined;

  const isDark = mode === "dark";

  const get = <K extends keyof CustomTheme>(
    lightKey: K,
    darkKey: K
  ): string | undefined => {
    const value = isDark ? customTheme[darkKey] : customTheme[lightKey];
    return value || undefined;
  };

  return {
    "--background": get("background", "backgroundDark"),
    "--foreground": get("foreground", "foregroundDark"),
    "--card": get("card", "cardDark"),
    "--card-foreground": get("cardForeground", "cardForegroundDark"),
    "--popover": get("popover", "popoverDark"),
    "--popover-foreground": get("popoverForeground", "popoverForegroundDark"),
    "--primary": get("primary", "primaryDark"),
    "--primary-foreground": get("primaryForeground", "primaryForegroundDark"),
    "--secondary": get("secondary", "secondaryDark"),
    "--secondary-foreground": get("secondaryForeground", "secondaryForegroundDark"),
    "--muted": get("muted", "mutedDark"),
    "--muted-foreground": get("mutedForeground", "mutedForegroundDark"),
    "--accent": get("accent", "accentDark"),
    "--accent-foreground": get("accentForeground", "accentForegroundDark"),
    "--destructive": get("destructive", "destructiveDark"),
    "--destructive-foreground": get("destructiveForeground", "destructiveForegroundDark"),
    "--border": get("border", "borderDark"),
    "--input": get("input", "inputDark"),
    "--ring": get("ring", "ringDark"),
    "--chart-1": get("chart1", "chart1Dark"),
    "--chart-2": get("chart2", "chart2Dark"),
    "--chart-3": get("chart3", "chart3Dark"),
    "--chart-4": get("chart4", "chart4Dark"),
    "--chart-5": get("chart5", "chart5Dark"),
    "--sidebar": get("sidebar", "sidebarDark"),
    "--sidebar-foreground": get("sidebarForeground", "sidebarForegroundDark"),
    "--sidebar-primary": get("sidebarPrimary", "sidebarPrimaryDark"),
    "--sidebar-primary-foreground": get("sidebarPrimaryForeground", "sidebarPrimaryForegroundDark"),
    "--sidebar-accent": get("sidebarAccent", "sidebarAccentDark"),
    "--sidebar-accent-foreground": get("sidebarAccentForeground", "sidebarAccentForegroundDark"),
    "--sidebar-border": get("sidebarBorder", "sidebarBorderDark"),
    "--sidebar-ring": get("sidebarRing", "sidebarRingDark"),
    "--shadow": get("shadow", "shadowDark"),
    "--shadow-lg": get("shadowLg", "shadowLgDark"),
    "--radius": customTheme.radius || undefined,
    "--font-sans": customTheme.fontBody
      ? `"${customTheme.fontBody}", ui-sans-serif, system-ui, sans-serif`
      : undefined,
    "--font-heading": customTheme.fontHeading
      ? `"${customTheme.fontHeading}", sans-serif`
      : undefined,
  };
}

export function getFontStylesServer(
  customTheme: CustomTheme | null | undefined
): CustomThemeStyles | undefined {
  if (!customTheme) return undefined;

  const fontSans = customTheme.fontBody
    ? `"${customTheme.fontBody}", ui-sans-serif, system-ui, sans-serif`
    : undefined;
  const fontHeading = customTheme.fontHeading
    ? `"${customTheme.fontHeading}", sans-serif`
    : undefined;

  if (!fontSans && !fontHeading) return undefined;

  return {
    "--font-sans": fontSans,
    "--font-heading": fontHeading,
  };
}

type TenantWithTheme = {
  theme: string | null;
  customTheme: CustomTheme | null;
  mode: TenantMode | null;
};

export function computeThemeStyles(tenant: TenantWithTheme | null | undefined) {
  if (!tenant) return { customStyles: undefined, themeClass: "" };

  const usePresetTheme = tenant.theme !== null && tenant.theme !== undefined;
  const colorStyles = usePresetTheme ? undefined : computeCustomStyles(tenant.customTheme, tenant.mode);
  const fontStyles = getFontStylesServer(tenant.customTheme);

  return {
    themeClass: usePresetTheme ? `theme-${tenant.theme}` : "",
    customStyles: colorStyles ? { ...colorStyles, ...fontStyles } : fontStyles,
  };
}
