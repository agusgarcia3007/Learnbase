import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { withUserContext, createTelemetryConfig } from "@/lib/ai/telemetry";
import { videosTable, documentsTable, quizzesTable } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
import { generateText } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import {
  buildModulePrompt,
  parseGeneratedModule,
  type ModuleContentItem,
} from "@/lib/ai/module-generation";
import { logger } from "@/lib/logger";

const contentTypeEnum = t.Union([
  t.Literal("video"),
  t.Literal("document"),
  t.Literal("quiz"),
]);

export const moduleGenerationRoutes = new Elysia({ name: "ai-module-generation" })
  .use(authPlugin)
  .post(
    "/modules/generate",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (!ctx.user.tenantId) {
        throw new AppError(
          ErrorCode.TENANT_NOT_FOUND,
          "User has no tenant",
          404
        );
      }

      const canManage =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManage) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can generate module content",
          403
        );
      }

      const { items } = ctx.body;

        if (items.length === 0) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "At least one content item is required",
            400
          );
        }

        const videoIds = items
          .filter((i) => i.contentType === "video")
          .map((i) => i.contentId);
        const documentIds = items
          .filter((i) => i.contentType === "document")
          .map((i) => i.contentId);
        const quizIds = items
          .filter((i) => i.contentType === "quiz")
          .map((i) => i.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db
                .select({
                  id: videosTable.id,
                  title: videosTable.title,
                  description: videosTable.description,
                  tenantId: videosTable.tenantId,
                })
                .from(videosTable)
                .where(
                  and(
                    inArray(videosTable.id, videoIds),
                    eq(videosTable.tenantId, ctx.user.tenantId)
                  )
                )
            : [],
          documentIds.length > 0
            ? db
                .select({
                  id: documentsTable.id,
                  title: documentsTable.title,
                  description: documentsTable.description,
                  tenantId: documentsTable.tenantId,
                })
                .from(documentsTable)
                .where(
                  and(
                    inArray(documentsTable.id, documentIds),
                    eq(documentsTable.tenantId, ctx.user.tenantId)
                  )
                )
            : [],
          quizIds.length > 0
            ? db
                .select({
                  id: quizzesTable.id,
                  title: quizzesTable.title,
                  description: quizzesTable.description,
                  tenantId: quizzesTable.tenantId,
                })
                .from(quizzesTable)
                .where(
                  and(
                    inArray(quizzesTable.id, quizIds),
                    eq(quizzesTable.tenantId, ctx.user.tenantId)
                  )
                )
            : [],
        ]);

        const contentItems: ModuleContentItem[] = [
          ...videos.map((v) => ({
            type: "video" as const,
            title: v.title,
            description: v.description,
          })),
          ...documents.map((d) => ({
            type: "document" as const,
            title: d.title,
            description: d.description,
          })),
          ...quizzes.map((q) => ({
            type: "quiz" as const,
            title: q.title,
            description: q.description,
          })),
        ];

        if (contentItems.length === 0) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "No valid content found for the provided items",
            400
          );
        }

        logger.info("Generating module content with AI", {
          itemCount: contentItems.length,
        });

        const result = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "module-generation",
            metadata: { itemCount: contentItems.length.toString() },
          },
          async () => {
            const prompt = buildModulePrompt(contentItems);

            const { text } = await generateText({
              model: groq(AI_MODELS.COURSE_GENERATION),
              prompt,
              maxOutputTokens: 500,
              ...createTelemetryConfig("module-content-generation"),
            });

            if (!text) {
              throw new AppError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Failed to generate module content",
                500
              );
            }

          return parseGeneratedModule(text);
        }
      );

      return result;
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            contentType: contentTypeEnum,
            contentId: t.String({ format: "uuid" }),
          }),
          { minItems: 1 }
        ),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate module title and description from content items",
      },
    }
  );
