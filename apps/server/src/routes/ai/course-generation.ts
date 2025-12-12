import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  withUserContext,
  createTelemetryConfig,
} from "@/lib/ai/telemetry";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  modulesTable,
  moduleItemsTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
import { aiGateway } from "@/lib/ai/gateway";
import { generateText } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import {
  buildCoursePrompt,
  buildThumbnailPrompt,
  parseGeneratedCourse,
  type CourseContentItem,
} from "@/lib/ai/course-generation";
import { logger } from "@/lib/logger";

export const courseGenerationRoutes = new Elysia({ name: "ai-course-generation" })
  .use(authPlugin)
  .post(
    "/courses/generate",
    (ctx) =>
      withHandler(ctx, async () => {
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
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can generate course content",
            403
          );
        }

        const { moduleIds } = ctx.body;

        const moduleItems = await db
          .select({
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
          })
          .from(moduleItemsTable)
          .innerJoin(
            modulesTable,
            eq(moduleItemsTable.moduleId, modulesTable.id)
          )
          .where(
            and(
              inArray(moduleItemsTable.moduleId, moduleIds),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          );

        if (moduleItems.length === 0) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Selected modules have no content",
            400
          );
        }

        const videoIds = moduleItems
          .filter((i) => i.contentType === "video")
          .map((i) => i.contentId);
        const documentIds = moduleItems
          .filter((i) => i.contentType === "document")
          .map((i) => i.contentId);
        const quizIds = moduleItems
          .filter((i) => i.contentType === "quiz")
          .map((i) => i.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db
                .select({
                  title: videosTable.title,
                  description: videosTable.description,
                })
                .from(videosTable)
                .where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db
                .select({
                  title: documentsTable.title,
                  description: documentsTable.description,
                })
                .from(documentsTable)
                .where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db
                .select({
                  title: quizzesTable.title,
                  description: quizzesTable.description,
                })
                .from(quizzesTable)
                .where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const contentItems: CourseContentItem[] = [
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

        logger.info("Generating course content with AI", {
          moduleCount: moduleIds.length,
          itemCount: contentItems.length,
        });

        const result = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "course-generation",
            metadata: { moduleCount: moduleIds.length.toString() },
          },
          async () => {
            const coursePrompt = buildCoursePrompt(contentItems);
            const contentStart = Date.now();

            const { text: contentText } = await generateText({
              model: groq(AI_MODELS.COURSE_GENERATION),
              prompt: coursePrompt,
              maxOutputTokens: 2000,
              ...createTelemetryConfig("course-content-generation"),
            });

            const contentTime = Date.now() - contentStart;

            logger.info("Course content generation completed", {
              contentTime: `${contentTime}ms`,
            });

            if (!contentText) {
              throw new AppError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Failed to generate course content",
                500
              );
            }

            const courseContent = parseGeneratedCourse(contentText);

            let thumbnail: string | null = null;
            try {
              const topics = contentItems.slice(0, 5).map((i) => i.title);
              const imagePrompt = buildThumbnailPrompt(
                courseContent.title,
                courseContent.shortDescription,
                topics
              );

              logger.info("Generating course thumbnail with AI Gateway");
              const imageStart = Date.now();

              const imageResult = await generateText({
                model: aiGateway(AI_MODELS.IMAGE_GENERATION),
                prompt: imagePrompt,
                ...createTelemetryConfig("thumbnail-generation"),
              });

              const imageTime = Date.now() - imageStart;
              logger.info("Thumbnail generation completed", {
                imageTime: `${imageTime}ms`,
              });

              const imageFile = imageResult.files?.find((f) =>
                f.mediaType.startsWith("image/")
              );

              if (imageFile?.base64) {
                thumbnail = `data:${imageFile.mediaType};base64,${imageFile.base64}`;
              }
            } catch (error) {
              logger.warn(
                "Thumbnail generation failed, continuing without thumbnail",
                {
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              );
            }

            return { ...courseContent, thumbnail };
          }
        );

        return result;
      }),
    {
      body: t.Object({
        moduleIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate course content and thumbnail from module items",
      },
    }
  );
