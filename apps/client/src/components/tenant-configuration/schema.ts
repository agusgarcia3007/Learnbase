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

export const configurationSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1),
  description: z.string().max(500).optional(),
  contactEmail: z.email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  twitter: z.url().optional().or(z.literal("")),
  facebook: z.url().optional().or(z.literal("")),
  instagram: z.url().optional().or(z.literal("")),
  linkedin: z.url().optional().or(z.literal("")),
  youtube: z.url().optional().or(z.literal("")),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
});

export type ConfigurationFormData = z.infer<typeof configurationSchema>;
