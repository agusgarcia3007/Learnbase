import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { aiFeedbackTable, tenantAiProfilesTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getLangfuseClient } from "@/lib/ai/langfuse";
import {
  extractPreferenceFromCorrection,
  addPreferenceToProfile,
} from "@/lib/ai/profile-analysis";
import { logger } from "@/lib/logger";

export const aiFeedbackRoutes = new Elysia({ name: "ai-feedback" })
  .use(authPlugin)
  .use(guardPlugin)
  .post(
    "/feedback",
    async (ctx) => {
      if (!ctx.user?.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      const tenantId = ctx.user.tenantId;
      const userId = ctx.user.id;
      const {
        type,
        sessionId,
        traceId,
        messageIndex,
        originalContent,
        correctedContent,
        userInstruction,
      } = ctx.body;

      logger.info("Received AI feedback", {
        tenantId,
        userId,
        type,
        hasCorrection: !!correctedContent,
      });

      const [feedback] = await db
        .insert(aiFeedbackTable)
        .values({
          tenantId,
          userId,
          feedbackType: type,
          sessionId,
          traceId,
          messageIndex,
          originalContent,
          correctedContent,
          userInstruction,
        })
        .returning();

      if (traceId) {
        try {
          const langfuse = getLangfuseClient();
          langfuse.score.create({
            traceId,
            name: "user_feedback",
            value: type === "thumbs_up" ? 1 : type === "thumbs_down" ? -1 : 0,
            comment: userInstruction || undefined,
          });
        } catch (error) {
          logger.warn("Failed to send score to Langfuse", {
            traceId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (type === "correction" && correctedContent) {
        extractPreferenceFromCorrection(feedback.id).catch((error) => {
          logger.error("Background preference extraction failed", {
            feedbackId: feedback.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        });
      }

      return { success: true, feedbackId: feedback.id };
    },
    {
      body: t.Object({
        type: t.Union([
          t.Literal("thumbs_up"),
          t.Literal("thumbs_down"),
          t.Literal("correction"),
          t.Literal("preference_stated"),
        ]),
        sessionId: t.Optional(t.String()),
        traceId: t.Optional(t.String()),
        messageIndex: t.Optional(t.Number()),
        originalContent: t.Optional(t.String()),
        correctedContent: t.Optional(t.String()),
        userInstruction: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI"],
        summary: "Submit feedback for AI-generated content",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .post(
    "/preferences",
    async (ctx) => {
      if (!ctx.user?.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      const { rule } = ctx.body;

      await addPreferenceToProfile(ctx.user.tenantId, rule, "user_stated", 100);

      logger.info("User added explicit preference", {
        tenantId: ctx.user.tenantId,
        rule,
      });

      return { success: true };
    },
    {
      body: t.Object({
        rule: t.String({ minLength: 5, maxLength: 500 }),
      }),
      detail: {
        tags: ["AI"],
        summary: "Add an explicit style preference for the AI",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .get(
    "/profile",
    async (ctx) => {
      if (!ctx.user?.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      const [profile] = await db
        .select()
        .from(tenantAiProfilesTable)
        .where(eq(tenantAiProfilesTable.tenantId, ctx.user.tenantId))
        .limit(1);

      if (!profile) {
        return {
          profile: null,
          message: "No AI profile yet. Publish at least 2 courses to start learning.",
        };
      }

      return {
        profile: {
          inferredTone: profile.inferredTone,
          titleStyle: profile.titleStyle,
          descriptionStyle: profile.descriptionStyle,
          modulePatterns: profile.modulePatterns,
          vocabulary: profile.vocabulary,
          explicitPreferences: profile.explicitPreferences,
          coursesAnalyzed: profile.coursesAnalyzed,
          feedbackCount: profile.feedbackCount,
          lastAnalyzedAt: profile.lastAnalyzedAt,
          profileVersion: profile.profileVersion,
        },
      };
    },
    {
      detail: {
        tags: ["AI"],
        summary: "Get the tenant's AI learning profile",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .delete(
    "/preferences/:index",
    async (ctx) => {
      if (!ctx.user?.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      const index = parseInt(ctx.params.index, 10);
      if (isNaN(index) || index < 0) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Invalid preference index", 400);
      }

      const [profile] = await db
        .select()
        .from(tenantAiProfilesTable)
        .where(eq(tenantAiProfilesTable.tenantId, ctx.user.tenantId))
        .limit(1);

      if (!profile?.explicitPreferences?.rules) {
        throw new AppError(ErrorCode.NOT_FOUND, "No preferences found", 404);
      }

      const rules = profile.explicitPreferences.rules;
      if (index >= rules.length) {
        throw new AppError(ErrorCode.NOT_FOUND, "Preference not found", 404);
      }

      const removedRule = rules[index];
      const updatedRules = rules.filter((_, i) => i !== index);

      await db
        .update(tenantAiProfilesTable)
        .set({
          explicitPreferences: { rules: updatedRules },
          updatedAt: new Date(),
        })
        .where(eq(tenantAiProfilesTable.tenantId, ctx.user.tenantId));

      logger.info("User removed preference", {
        tenantId: ctx.user.tenantId,
        rule: removedRule.rule,
      });

      return { success: true, removedRule: removedRule.rule };
    },
    {
      params: t.Object({
        index: t.String(),
      }),
      detail: {
        tags: ["AI"],
        summary: "Remove an explicit preference by index",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .get(
    "/feedback/history",
    async (ctx) => {
      if (!ctx.user?.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      const feedback = await db
        .select({
          id: aiFeedbackTable.id,
          feedbackType: aiFeedbackTable.feedbackType,
          extractedPreference: aiFeedbackTable.extractedPreference,
          createdAt: aiFeedbackTable.createdAt,
        })
        .from(aiFeedbackTable)
        .where(eq(aiFeedbackTable.tenantId, ctx.user.tenantId))
        .orderBy(desc(aiFeedbackTable.createdAt))
        .limit(50);

      return { feedback };
    },
    {
      detail: {
        tags: ["AI"],
        summary: "Get recent AI feedback history",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  );
