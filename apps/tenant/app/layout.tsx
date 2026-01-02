import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { getTenant } from "@/lib/tenant";
import "./globals.css";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();

  if (!tenant) {
    return {
      title: "LearnBase",
      description: "Learning Management System",
    };
  }

  return {
    title: {
      default: tenant.seoTitle || tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description: tenant.seoDescription || undefined,
    keywords: tenant.seoKeywords?.split(",").map((k) => k.trim()) || undefined,
    icons: tenant.favicon ? { icon: tenant.favicon } : undefined,
    openGraph: {
      title: tenant.seoTitle || tenant.name,
      description: tenant.seoDescription || undefined,
      images: tenant.logo ? [{ url: tenant.logo }] : undefined,
      siteName: tenant.name,
    },
    twitter: {
      card: "summary_large_image",
      title: tenant.seoTitle || tenant.name,
      description: tenant.seoDescription || undefined,
      images: tenant.logo ? [tenant.logo] : undefined,
    },
  };
}

function generateThemeStyles(
  customTheme: Record<string, string> | null
): string {
  if (!customTheme) return "";

  const toKebab = (str: string) =>
    str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

  const cssVarMap: Record<string, string> = {
    background: "--background",
    foreground: "--foreground",
    primary: "--primary",
    "primary-foreground": "--primary-foreground",
    secondary: "--secondary",
    "secondary-foreground": "--secondary-foreground",
    accent: "--accent",
    "accent-foreground": "--accent-foreground",
    muted: "--muted",
    "muted-foreground": "--muted-foreground",
    border: "--border",
    ring: "--ring",
    card: "--card",
    "card-foreground": "--card-foreground",
    popover: "--popover",
    "popover-foreground": "--popover-foreground",
    destructive: "--destructive",
    "destructive-foreground": "--destructive-foreground",
    input: "--input",
    "chart-1": "--chart-1",
    "chart-2": "--chart-2",
    "chart-3": "--chart-3",
    "chart-4": "--chart-4",
    "chart-5": "--chart-5",
    sidebar: "--sidebar",
    "sidebar-foreground": "--sidebar-foreground",
    "sidebar-primary": "--sidebar-primary",
    "sidebar-primary-foreground": "--sidebar-primary-foreground",
    "sidebar-accent": "--sidebar-accent",
    "sidebar-accent-foreground": "--sidebar-accent-foreground",
    "sidebar-border": "--sidebar-border",
    "sidebar-ring": "--sidebar-ring",
    radius: "--radius",
  };

  const lightVars: string[] = [];
  const darkVars: string[] = [];

  for (const [key, value] of Object.entries(customTheme)) {
    if (!value || key === "fontHeading" || key === "fontBody" || key.includes("shadow")) continue;

    const isDark = key.endsWith("Dark");
    const baseKey = isDark ? key.slice(0, -4) : key;
    const kebabKey = toKebab(baseKey);
    const cssVar = cssVarMap[kebabKey];

    if (cssVar) {
      if (isDark) {
        darkVars.push(`${cssVar}: ${value};`);
      } else {
        lightVars.push(`${cssVar}: ${value};`);
      }
    }
  }

  let styles = "";
  if (lightVars.length > 0) {
    styles += `:root { ${lightVars.join(" ")} }`;
  }
  if (darkVars.length > 0) {
    styles += ` .dark { ${darkVars.join(" ")} }`;
  }

  return styles;
}

function getThemeClass(mode: "light" | "dark" | "auto" | null): string {
  if (mode === "dark") return "dark";
  if (mode === "light") return "";
  return "";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();
  const themeStyles = generateThemeStyles(tenant?.customTheme ?? null);
  const themeClass = getThemeClass(tenant?.mode ?? null);

  return (
    <html
      lang={tenant?.aiAssistantSettings?.preferredLanguage || "en"}
      className={`${raleway.variable} ${themeClass}`.trim()}
    >
      <head>
        {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
