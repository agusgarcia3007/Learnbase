import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { tenantsTable, usersTable } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { invalidateUserCache } from "@/plugins/auth";
import { invalidateTenantCache } from "@/plugins/tenant";
import { getPresignedUrl, uploadBase64ToS3, copyS3Object } from "@/lib/upload";

const RESERVED_SLUGS = ["www", "api", "admin", "app", "backoffice", "dashboard", "news"];

export type OnboardingToolContext = {
  userId: string;
  tenantId: string | null;
  setTenantId: (id: string) => void;
};

const validateSlugSchema = z.object({
  slug: z.string().min(2).describe("The URL slug to validate (lowercase, numbers, hyphens only)"),
});

const createTenantSchema = z.object({
  name: z.string().min(2).describe("The name of the academy/learning platform"),
  slug: z.string().min(2).describe("The URL slug (must be validated first)"),
});

const updateTenantSettingsSchema = z.object({
  description: z.string().optional().describe("Platform description"),
  contactEmail: z.string().email().optional().describe("Contact email address"),
  heroTitle: z.string().optional().describe("Homepage hero title"),
  heroSubtitle: z.string().optional().describe("Homepage hero subtitle"),
  socialLinks: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
  }).optional().describe("Social media links"),
});

const uploadLogoSchema = z.object({
  imageKey: z.string().describe("S3 key of the uploaded image (from temp folder)"),
});

const generateThemeSchema = z.object({
  primaryColor: z.string().optional().describe("Primary color in hex format (e.g., #3b82f6)"),
  style: z.enum(["modern", "minimal", "playful", "professional", "retro", "futuristic"])
    .optional()
    .describe("Visual style preference"),
});

export function createOnboardingTools(ctx: OnboardingToolContext) {
  const { userId } = ctx;
  let currentTenantId = ctx.tenantId;

  const getTenantId = () => currentTenantId;
  const setTenantId = (id: string) => {
    currentTenantId = id;
    ctx.setTenantId(id);
  };

  return {
    validateSlug: tool({
      description: "Check if a slug is available for the new academy. Call this before createTenant to ensure the slug is valid.",
      inputSchema: validateSlugSchema,
      execute: async ({ slug }) => {
        const normalizedSlug = slug.toLowerCase().trim();

        if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
          return {
            available: false,
            error: "Slug can only contain lowercase letters, numbers, and hyphens",
            suggestion: normalizedSlug.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
          };
        }

        if (normalizedSlug.length < 2) {
          return {
            available: false,
            error: "Slug must be at least 2 characters",
          };
        }

        if (normalizedSlug.length > 50) {
          return {
            available: false,
            error: "Slug must be 50 characters or less",
            suggestion: normalizedSlug.slice(0, 50),
          };
        }

        if (RESERVED_SLUGS.includes(normalizedSlug)) {
          return {
            available: false,
            error: "This slug is reserved",
            suggestion: `my-${normalizedSlug}`,
          };
        }

        const [existing] = await db
          .select({ id: tenantsTable.id })
          .from(tenantsTable)
          .where(eq(tenantsTable.slug, normalizedSlug))
          .limit(1);

        if (existing) {
          const timestamp = Date.now().toString().slice(-4);
          return {
            available: false,
            error: "This slug is already taken",
            suggestion: `${normalizedSlug}-${timestamp}`,
          };
        }

        logger.info("validateSlug: slug is available", { slug: normalizedSlug });
        return { available: true, slug: normalizedSlug };
      },
    }),

    createTenant: tool({
      description: "Create a new tenant (academy) with the given name and slug. The slug MUST be validated first with validateSlug.",
      inputSchema: createTenantSchema,
      execute: async ({ name, slug }) => {
        const normalizedSlug = slug.toLowerCase().trim();

        if (RESERVED_SLUGS.includes(normalizedSlug)) {
          return { success: false, error: "This slug is reserved" };
        }

        const result = await db.transaction(async (tx) => {
          const [tenant] = await tx
            .insert(tenantsTable)
            .values({
              slug: normalizedSlug,
              name,
            })
            .onConflictDoNothing({ target: tenantsTable.slug })
            .returning();

          if (!tenant) {
            return { success: false, error: "Slug already exists. Please try a different one." };
          }

          await tx
            .update(usersTable)
            .set({ tenantId: tenant.id })
            .where(eq(usersTable.id, userId));

          return { success: true, tenant };
        });

        if (!result.success) {
          return result;
        }

        invalidateUserCache(userId);
        setTenantId(result.tenant!.id);

        logger.info("createTenant: tenant created", {
          tenantId: result.tenant!.id,
          slug: normalizedSlug,
          userId,
        });

        return {
          success: true,
          tenant: {
            id: result.tenant!.id,
            name: result.tenant!.name,
            slug: result.tenant!.slug,
          },
        };
      },
    }),

    updateTenantSettings: tool({
      description: "Update tenant settings like description, contact email, hero text, and social links. Only call after tenant is created.",
      inputSchema: updateTenantSettingsSchema,
      execute: async ({ description, contactEmail, heroTitle, heroSubtitle, socialLinks }) => {
        const tenantId = getTenantId();
        if (!tenantId) {
          return { success: false, error: "No tenant created yet. Create a tenant first." };
        }

        const [tenant] = await db
          .select({ slug: tenantsTable.slug })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, tenantId))
          .limit(1);

        if (!tenant) {
          return { success: false, error: "Tenant not found" };
        }

        const updateData: Record<string, unknown> = {};
        if (description !== undefined) updateData.description = description;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (heroTitle !== undefined) updateData.heroTitle = heroTitle;
        if (heroSubtitle !== undefined) updateData.heroSubtitle = heroSubtitle;
        if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

        if (Object.keys(updateData).length === 0) {
          return { success: false, error: "No settings provided to update" };
        }

        await db
          .update(tenantsTable)
          .set(updateData)
          .where(eq(tenantsTable.id, tenantId));

        invalidateTenantCache(tenant.slug);

        logger.info("updateTenantSettings: settings updated", {
          tenantId,
          fields: Object.keys(updateData),
        });

        return {
          success: true,
          updatedFields: Object.keys(updateData),
        };
      },
    }),

    uploadLogo: tool({
      description: "Set the tenant logo from an uploaded image. The imageKey should be the S3 key returned when the user uploaded an image.",
      inputSchema: uploadLogoSchema,
      execute: async ({ imageKey }) => {
        const tenantId = getTenantId();
        if (!tenantId) {
          return { success: false, error: "No tenant created yet. Create a tenant first." };
        }

        const [tenant] = await db
          .select({ slug: tenantsTable.slug, logo: tenantsTable.logo })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, tenantId))
          .limit(1);

        if (!tenant) {
          return { success: false, error: "Tenant not found" };
        }

        const newLogoKey = await copyS3Object(imageKey, `logos/${tenantId}`);

        await db
          .update(tenantsTable)
          .set({ logo: newLogoKey, favicon: newLogoKey })
          .where(eq(tenantsTable.id, tenantId));

        invalidateTenantCache(tenant.slug);

        logger.info("uploadLogo: logo updated", { tenantId, logoKey: newLogoKey });

        return {
          success: true,
          logoUrl: getPresignedUrl(newLogoKey),
        };
      },
    }),

    skipPersonalization: tool({
      description: "User wants to skip remaining personalization and go to the dashboard. Call this when user says 'skip', 'later', 'explore on my own', etc.",
      inputSchema: z.object({}),
      execute: async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
          return { success: false, error: "No tenant created yet" };
        }

        const [tenant] = await db
          .select({ slug: tenantsTable.slug })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, tenantId))
          .limit(1);

        if (!tenant) {
          return { success: false, error: "Tenant not found" };
        }

        logger.info("skipPersonalization: user skipped", { tenantId });

        return {
          success: true,
          action: "redirect",
          redirectTo: `/${tenant.slug}`,
        };
      },
    }),
  };
}

export type OnboardingTools = ReturnType<typeof createOnboardingTools>;
