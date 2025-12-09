import { z } from "zod";
import type { TenantTheme } from "@/services/tenants/service";

export const THEMES: { id: TenantTheme; color: string }[] = [
  { id: "default", color: "#7c3aed" },
  { id: "slate", color: "#1e293b" },
  { id: "rose", color: "#f43f5e" },
  { id: "emerald", color: "#10b981" },
  { id: "tangerine", color: "#f97316" },
  { id: "ocean", color: "#0ea5e9" },
];

const customThemeSchema = z.object({
  primary: z.string(),
  primaryForeground: z.string(),
  secondary: z.string(),
  secondaryForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  ring: z.string(),
  radius: z.string(),
  primaryDark: z.string(),
  primaryForegroundDark: z.string(),
  secondaryDark: z.string(),
  secondaryForegroundDark: z.string(),
  accentDark: z.string(),
  accentForegroundDark: z.string(),
  ringDark: z.string(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  shadow: z.string().optional(),
  shadowLg: z.string().optional(),
});

export const customizationSchema = z.object({
  theme: z
    .enum(["default", "slate", "rose", "emerald", "tangerine", "ocean"])
    .nullable()
    .optional(),
  mode: z
    .enum(["light", "dark", "auto"])
    .nullable()
    .optional(),
  heroPattern: z.enum(["none", "grid", "dots", "waves"]).nullable().optional(),
  coursesPagePattern: z.enum(["none", "grid", "dots", "waves"]).nullable().optional(),
  showHeaderName: z.boolean().optional(),
  heroTitle: z.string().max(100).optional(),
  heroSubtitle: z.string().max(200).optional(),
  heroCta: z.string().max(50).optional(),
  footerText: z.string().max(200).optional(),
  customTheme: customThemeSchema.nullable().optional(),
});

export type CustomizationFormData = z.infer<typeof customizationSchema>;
