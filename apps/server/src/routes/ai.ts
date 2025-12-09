import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  quizQuestionsTable,
  modulesTable,
  moduleItemsTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
import { generateText, gateway } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { VIDEO_ANALYSIS_PROMPT } from "@/lib/ai/prompts";
import { transcribeVideo } from "@/lib/ai/transcript";
import { extractTextFromDocument } from "@/lib/ai/document-extract";
import {
  buildQuizPrompt,
  parseGeneratedQuestions,
} from "@/lib/ai/quiz-generation";
import {
  buildCoursePrompt,
  buildThumbnailPrompt,
  parseGeneratedCourse,
  type CourseContentItem,
} from "@/lib/ai/course-generation";
import { getPresignedUrl } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const aiRoutes = new Elysia().use(authPlugin).post(
  "/videos/:id/analyze",
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
          "Only owners and admins can analyze videos",
          403
        );
      }

      const [video] = await db
        .select()
        .from(videosTable)
        .where(
          and(
            eq(videosTable.id, ctx.params.id),
            eq(videosTable.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!video) {
        throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
      }

      if (!video.videoKey) {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Video has no file uploaded",
          400
        );
      }

      const videoUrl = getPresignedUrl(video.videoKey);

      logger.info("Starting video analysis", { videoId: video.id });

      const transcript = await transcribeVideo(videoUrl);

      const contentStart = Date.now();
      const { text: contentText } = await generateText({
        model: groq(AI_MODELS.CONTENT_GENERATION),
        system: VIDEO_ANALYSIS_PROMPT,
        prompt: transcript,
        maxOutputTokens: 500,
      });
      const contentTime = Date.now() - contentStart;

      logger.info("Groq content generation completed", {
        videoId: video.id,
        contentTime: `${contentTime}ms`,
      });
      if (!contentText) {
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to generate content",
          500
        );
      }

      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to parse AI response",
          500
        );
      }

      const { title, description } = JSON.parse(jsonMatch[0]) as {
        title: string;
        description: string;
      };

      return { title, description };
    }),
  {
    params: t.Object({
      id: t.String({ format: "uuid" }),
    }),
    detail: {
      tags: ["AI"],
      summary:
        "Analyze video with AI to generate transcript, title, and description",
    },
  }
).post(
  "/quizzes/:quizId/generate",
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
          "Only owners and admins can generate quiz questions",
          403
        );
      }

      const { sourceType, sourceId, count } = ctx.body;

      if (count < 1 || count > 10) {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Count must be between 1 and 10",
          400
        );
      }

      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, ctx.params.quizId),
            eq(quizzesTable.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!quiz) {
        throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
      }

      const existingQuestions = await db
        .select({ questionText: quizQuestionsTable.questionText })
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quiz.id));

      const existingTexts = existingQuestions.map((q) => q.questionText);

      let content: string;

      if (sourceType === "video") {
        const [video] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, sourceId),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!video) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        if (!video.videoKey) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Video has no file uploaded",
            400
          );
        }

        const videoUrl = getPresignedUrl(video.videoKey);
        logger.info("Starting video transcription for quiz", {
          videoId: video.id,
          quizId: quiz.id,
        });
        content = await transcribeVideo(videoUrl);
      } else {
        const [document] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, sourceId),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!document) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        if (!document.fileKey) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Document has no file uploaded",
            400
          );
        }

        const documentUrl = getPresignedUrl(document.fileKey);
        logger.info("Starting document extraction for quiz", {
          documentId: document.id,
          quizId: quiz.id,
          mimeType: document.mimeType,
        });
        content = await extractTextFromDocument(
          documentUrl,
          document.mimeType || "application/pdf"
        );
      }

      if (!content || content.length < 100) {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Content is too short to generate questions",
          400
        );
      }

      logger.info("Generating quiz questions with AI", {
        quizId: quiz.id,
        contentLength: content.length,
        count,
      });

      const prompt = buildQuizPrompt(content, count, existingTexts);
      const generationStart = Date.now();

      const { text: responseText } = await generateText({
        model: groq(AI_MODELS.QUIZ_GENERATION),
        prompt: prompt,
        maxOutputTokens: 4000,
        temperature: 0.7,
      });

      const generationTime = Date.now() - generationStart;

      logger.info("Quiz generation completed", {
        quizId: quiz.id,
        generationTime: `${generationTime}ms`,
      });

      if (!responseText) {
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to generate questions",
          500
        );
      }

      const questions = parseGeneratedQuestions(responseText).slice(0, count);

      return { questions };
    }),
  {
    params: t.Object({
      quizId: t.String({ format: "uuid" }),
    }),
    body: t.Object({
      sourceType: t.Union([t.Literal("video"), t.Literal("document")]),
      sourceId: t.String({ format: "uuid" }),
      count: t.Number({ minimum: 1, maximum: 10 }),
    }),
    detail: {
      tags: ["AI"],
      summary: "Generate quiz questions from video or document content",
    },
  }
).post(
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
        .innerJoin(modulesTable, eq(moduleItemsTable.moduleId, modulesTable.id))
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

      const coursePrompt = buildCoursePrompt(contentItems);
      const contentStart = Date.now();

      const { text: contentText } = await generateText({
        model: groq(AI_MODELS.COURSE_GENERATION),
        prompt: coursePrompt,
        maxOutputTokens: 2000,
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
          model: gateway(AI_MODELS.IMAGE_GENERATION),
          prompt: imagePrompt,
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
        logger.warn("Thumbnail generation failed, continuing without thumbnail", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return {
        ...courseContent,
        thumbnail,
      };
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
