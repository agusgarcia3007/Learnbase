import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { videosTable, documentsTable, quizzesTable, quizQuestionsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
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
      const contentResponse = await groq.chat.completions.create({
        model: AI_MODELS.CONTENT_GENERATION,
        messages: [
          { role: "system", content: VIDEO_ANALYSIS_PROMPT },
          { role: "user", content: transcript },
        ],
        max_tokens: 500,
      });
      const contentTime = Date.now() - contentStart;

      const contentText = contentResponse.choices[0]?.message?.content;

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

      const response = await groq.chat.completions.create({
        model: AI_MODELS.QUIZ_GENERATION,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      });

      const generationTime = Date.now() - generationStart;
      const responseText = response.choices[0]?.message?.content;

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
);
