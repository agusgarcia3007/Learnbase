import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  withUserContext,
  createTelemetryConfig,
} from "@/lib/ai/telemetry";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  quizQuestionsTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
import { generateText } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { VIDEO_ANALYSIS_PROMPT } from "@/lib/ai/prompts";
import { transcribeVideo } from "@/lib/ai/transcript";
import { extractTextFromDocument } from "@/lib/ai/document-extract";
import {
  buildQuizPrompt,
  parseGeneratedQuestions,
} from "@/lib/ai/quiz-generation";
import { getPresignedUrl } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const contentAnalysisRoutes = new Elysia({ name: "ai-content-analysis" })
  .use(authPlugin)
  .post(
    "/videos/analyze",
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
          "Only owners and instructors can analyze videos",
          403
        );
      }

      const { videoKey } = ctx.body;
      const videoUrl = getPresignedUrl(videoKey);

        logger.info("Starting video analysis", { videoKey });

        const { transcript, contentText } = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "video-analysis",
            metadata: { videoKey },
          },
          async () => {
            const transcript = await transcribeVideo(videoUrl);

            const contentStart = Date.now();
            const { text: contentText } = await generateText({
              model: groq(AI_MODELS.CONTENT_GENERATION),
              system: VIDEO_ANALYSIS_PROMPT,
              prompt: transcript,
              maxOutputTokens: 500,
              ...createTelemetryConfig("video-content-generation"),
            });
            const contentTime = Date.now() - contentStart;

            logger.info("Groq content generation completed", {
              videoKey,
              contentTime: `${contentTime}ms`,
            });

            return { transcript, contentText };
          }
        );
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

      const { videoId } = ctx.body;
      if (videoId) {
        await db
          .update(videosTable)
          .set({ transcript })
          .where(
            and(
              eq(videosTable.id, videoId),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          );
        logger.info("Transcript saved to video", { videoId });
      }

      return { title, description };
    },
    {
      body: t.Object({
        videoKey: t.String(),
        videoId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["AI"],
        summary:
          "Analyze video with AI to generate transcript, title, and description",
      },
    }
  )
  .post(
    "/quizzes/:quizId/generate",
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
          "Only owners and instructors can generate quiz questions",
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

        const questions = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "quiz-generation",
            metadata: { quizId: quiz.id, sourceType },
          },
          async () => {
            const generationStart = Date.now();

            const { text: responseText } = await generateText({
              model: groq(AI_MODELS.QUIZ_GENERATION),
              prompt,
              maxOutputTokens: 4000,
              temperature: 0.7,
              ...createTelemetryConfig("quiz-question-generation"),
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

          return parseGeneratedQuestions(responseText).slice(0, count);
        }
      );

      return { questions };
    },
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
  );
