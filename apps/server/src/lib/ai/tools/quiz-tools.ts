import { tool, generateText } from "ai";
import { db } from "@/db";
import { quizzesTable, quizQuestionsTable, quizOptionsTable, videosTable, documentsTable, moduleItemsTable } from "@/db/schema";
import { eq, and, desc, sql, isNotNull, gt, inArray } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { generateEmbedding } from "../embeddings";
import { transcribeVideo } from "../transcript";
import { extractTextFromDocument } from "../document-extract";
import { buildQuizPrompt, parseGeneratedQuestions } from "../quiz-generation";
import { groq } from "../groq";
import { AI_MODELS } from "../models";
import { getPresignedUrl } from "@/lib/upload";
import {
  createQuizSchema,
  getQuizSchema,
  updateQuizMetadataSchema,
  deleteQuizSchema,
  addQuizQuestionSchema,
  updateQuizQuestionSchema,
  deleteQuizQuestionSchema,
  reorderQuizQuestionsSchema,
  addQuizOptionSchema,
  updateQuizOptionSchema,
  deleteQuizOptionSchema,
  generateQuizFromContentSchema,
} from "./schemas";
import { SIMILARITY_THRESHOLDS, type ToolContext } from "./utils";

export function createQuizTools(ctx: ToolContext) {
  const { tenantId } = ctx;

  return {
    createQuiz: tool({
      description: "Create a new quiz with questions and options. Quiz is created as published. Returns existing quiz if similar one already exists.",
      inputSchema: createQuizSchema,
      execute: async ({ title, description, questions }) => {
        const text = `${title} ${description || ""}`.trim();
        const queryEmbedding = await generateEmbedding(text);
        const similarity = sql<number>`1 - (${cosineDistance(quizzesTable.embedding, queryEmbedding)})`;

        const existingQuizzes = await db
          .select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            similarity,
          })
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.tenantId, tenantId),
              eq(quizzesTable.status, "published"),
              isNotNull(quizzesTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.DEDUP_CREATE)
            )
          )
          .orderBy(desc(similarity))
          .limit(1);

        if (existingQuizzes.length > 0) {
          const existing = existingQuizzes[0];
          logger.info("createQuiz: found existing similar quiz", {
            existingId: existing.id,
            existingTitle: existing.title,
            requestedTitle: title,
            similarity: existing.similarity,
          });
          return {
            id: existing.id,
            title: existing.title,
            questionsCount: 0,
            alreadyExisted: true,
          };
        }

        const [quiz] = await db
          .insert(quizzesTable)
          .values({
            tenantId,
            title,
            description: description ?? null,
            status: "published",
          })
          .returning();

        const embedding = await generateEmbedding(text);
        await db
          .update(quizzesTable)
          .set({ embedding })
          .where(eq(quizzesTable.id, quiz.id));

        const questionValues = questions.map((q, i) => {
          const correctCount = q.options.filter((o) => o.isCorrect).length;
          return {
            quizId: quiz.id,
            tenantId,
            type: q.type === "true_false"
              ? "true_false" as const
              : correctCount > 1
                ? "multiple_select" as const
                : "multiple_choice" as const,
            questionText: q.questionText,
            explanation: q.explanation ?? null,
            order: i,
          };
        });

        const insertedQuestions = await db
          .insert(quizQuestionsTable)
          .values(questionValues)
          .returning();

        const optionValues = insertedQuestions.flatMap((question, i) =>
          questions[i].options.map((opt, j) => ({
            questionId: question.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: j,
          }))
        );

        if (optionValues.length > 0) {
          await db.insert(quizOptionsTable).values(optionValues);
        }

        logger.info("createQuiz executed", {
          quizId: quiz.id,
          questionCount: questions.length,
        });

        return {
          id: quiz.id,
          title: quiz.title,
          questionsCount: questions.length,
        };
      },
    }),

    getQuiz: tool({
      description: "Get a quiz with all its questions and options.",
      inputSchema: getQuizSchema,
      execute: async ({ quizId }) => {
        const [quiz] = await db
          .select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            description: quizzesTable.description,
            status: quizzesTable.status,
          })
          .from(quizzesTable)
          .where(and(eq(quizzesTable.tenantId, tenantId), eq(quizzesTable.id, quizId)))
          .limit(1);

        if (!quiz) {
          return { type: "error" as const, error: "Quiz not found" };
        }

        const questions = await db
          .select({
            id: quizQuestionsTable.id,
            type: quizQuestionsTable.type,
            questionText: quizQuestionsTable.questionText,
            explanation: quizQuestionsTable.explanation,
            order: quizQuestionsTable.order,
          })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.quizId, quizId))
          .orderBy(quizQuestionsTable.order);

        const questionIds = questions.map((q) => q.id);
        const options = questionIds.length > 0
          ? await db
              .select({
                id: quizOptionsTable.id,
                questionId: quizOptionsTable.questionId,
                optionText: quizOptionsTable.optionText,
                isCorrect: quizOptionsTable.isCorrect,
                order: quizOptionsTable.order,
              })
              .from(quizOptionsTable)
              .where(inArray(quizOptionsTable.questionId, questionIds))
              .orderBy(quizOptionsTable.order)
          : [];

        const questionsWithOptions = questions.map((q) => ({
          ...q,
          options: options.filter((o) => o.questionId === q.id),
        }));

        logger.info("getQuiz executed", { quizId, questionsCount: questions.length });
        return { type: "quiz_details" as const, quiz: { ...quiz, questions: questionsWithOptions } };
      },
    }),

    updateQuiz: tool({
      description: "Update a quiz's title, description, or status.",
      inputSchema: updateQuizMetadataSchema,
      execute: async ({ quizId, title, description, status }) => {
        const [existing] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(and(eq(quizzesTable.tenantId, tenantId), eq(quizzesTable.id, quizId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Quiz not found" };
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0) {
          return { type: "error" as const, error: "No fields to update" };
        }

        await db.update(quizzesTable).set(updateData).where(eq(quizzesTable.id, quizId));

        logger.info("updateQuiz executed", { quizId, updatedFields: Object.keys(updateData) });
        return { type: "quiz_updated" as const, quizId, updatedFields: Object.keys(updateData) };
      },
    }),

    deleteQuiz: tool({
      description: "Delete a quiz and all its questions. Requires confirmation.",
      inputSchema: deleteQuizSchema,
      execute: async ({ quizId, confirmed }) => {
        const [existing] = await db
          .select({ id: quizzesTable.id, title: quizzesTable.title })
          .from(quizzesTable)
          .where(and(eq(quizzesTable.tenantId, tenantId), eq(quizzesTable.id, quizId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Quiz not found" };
        }

        if (!confirmed) {
          return {
            type: "confirmation_required" as const,
            action: "delete_quiz",
            quizId,
            quizTitle: existing.title,
            message: `Are you sure you want to delete quiz "${existing.title}"? All questions will be deleted.`,
          };
        }

        await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));

        logger.info("deleteQuiz executed", { quizId, title: existing.title });
        return { type: "quiz_deleted" as const, quizId, title: existing.title };
      },
    }),

    addQuizQuestion: tool({
      description: "Add a new question to an existing quiz.",
      inputSchema: addQuizQuestionSchema,
      execute: async ({ quizId, type, questionText, explanation, options }) => {
        const [quiz] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(and(eq(quizzesTable.tenantId, tenantId), eq(quizzesTable.id, quizId)))
          .limit(1);

        if (!quiz) {
          return { type: "error" as const, error: "Quiz not found" };
        }

        const [maxOrder] = await db
          .select({ maxOrder: quizQuestionsTable.order })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.quizId, quizId))
          .orderBy(desc(quizQuestionsTable.order))
          .limit(1);

        const correctCount = options.filter((o) => o.isCorrect).length;
        const questionType = type === "true_false"
          ? "true_false"
          : correctCount > 1
            ? "multiple_select"
            : "multiple_choice";

        const [question] = await db
          .insert(quizQuestionsTable)
          .values({
            quizId,
            tenantId,
            type: questionType,
            questionText,
            explanation: explanation ?? null,
            order: (maxOrder?.maxOrder ?? -1) + 1,
          })
          .returning();

        const optionValues = options.map((opt, i) => ({
          questionId: question.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          order: i,
        }));

        await db.insert(quizOptionsTable).values(optionValues);

        logger.info("addQuizQuestion executed", { quizId, questionId: question.id });
        return { type: "question_added" as const, questionId: question.id, optionsCount: options.length };
      },
    }),

    updateQuizQuestion: tool({
      description: "Update a quiz question's type, text, or explanation. Use this to fix questions that have the wrong type (e.g., change from multiple_choice to multiple_select when there are multiple correct answers).",
      inputSchema: updateQuizQuestionSchema,
      execute: async ({ questionId, type, questionText, explanation }) => {
        const [existing] = await db
          .select({ id: quizQuestionsTable.id, tenantId: quizQuestionsTable.tenantId })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, questionId))
          .limit(1);

        if (!existing || existing.tenantId !== tenantId) {
          return { type: "error" as const, error: "Question not found" };
        }

        const updateData: Record<string, unknown> = {};
        if (type !== undefined) updateData.type = type;
        if (questionText !== undefined) updateData.questionText = questionText;
        if (explanation !== undefined) updateData.explanation = explanation;

        if (Object.keys(updateData).length === 0) {
          return { type: "error" as const, error: "No fields to update" };
        }

        await db.update(quizQuestionsTable).set(updateData).where(eq(quizQuestionsTable.id, questionId));

        logger.info("updateQuizQuestion executed", { questionId, updatedFields: Object.keys(updateData) });
        return { type: "question_updated" as const, questionId, updatedFields: Object.keys(updateData) };
      },
    }),

    deleteQuizQuestion: tool({
      description: "Delete a question from a quiz.",
      inputSchema: deleteQuizQuestionSchema,
      execute: async ({ questionId }) => {
        const [existing] = await db
          .select({ id: quizQuestionsTable.id, tenantId: quizQuestionsTable.tenantId })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, questionId))
          .limit(1);

        if (!existing || existing.tenantId !== tenantId) {
          return { type: "error" as const, error: "Question not found" };
        }

        await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, questionId));

        logger.info("deleteQuizQuestion executed", { questionId });
        return { type: "question_deleted" as const, questionId };
      },
    }),

    reorderQuizQuestions: tool({
      description: "Reorder questions in a quiz by providing the question IDs in the desired order.",
      inputSchema: reorderQuizQuestionsSchema,
      execute: async ({ quizId, questionIds }) => {
        const [quiz] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(and(eq(quizzesTable.tenantId, tenantId), eq(quizzesTable.id, quizId)))
          .limit(1);

        if (!quiz) {
          return { type: "error" as const, error: "Quiz not found" };
        }

        for (let i = 0; i < questionIds.length; i++) {
          await db
            .update(quizQuestionsTable)
            .set({ order: i })
            .where(and(eq(quizQuestionsTable.id, questionIds[i]), eq(quizQuestionsTable.quizId, quizId)));
        }

        logger.info("reorderQuizQuestions executed", { quizId, questionsCount: questionIds.length });
        return { type: "questions_reordered" as const, quizId, questionsCount: questionIds.length };
      },
    }),

    addQuizOption: tool({
      description: "Add a new option to a quiz question.",
      inputSchema: addQuizOptionSchema,
      execute: async ({ questionId, optionText, isCorrect }) => {
        const [question] = await db
          .select({ id: quizQuestionsTable.id, tenantId: quizQuestionsTable.tenantId })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, questionId))
          .limit(1);

        if (!question || question.tenantId !== tenantId) {
          return { type: "error" as const, error: "Question not found" };
        }

        const [maxOrder] = await db
          .select({ maxOrder: quizOptionsTable.order })
          .from(quizOptionsTable)
          .where(eq(quizOptionsTable.questionId, questionId))
          .orderBy(desc(quizOptionsTable.order))
          .limit(1);

        const [option] = await db
          .insert(quizOptionsTable)
          .values({
            questionId,
            optionText,
            isCorrect,
            order: (maxOrder?.maxOrder ?? -1) + 1,
          })
          .returning();

        logger.info("addQuizOption executed", { questionId, optionId: option.id });
        return { type: "option_added" as const, optionId: option.id };
      },
    }),

    updateQuizOption: tool({
      description: "Update a quiz option's text or correct status.",
      inputSchema: updateQuizOptionSchema,
      execute: async ({ optionId, optionText, isCorrect }) => {
        const [existing] = await db
          .select({
            id: quizOptionsTable.id,
            questionId: quizOptionsTable.questionId,
          })
          .from(quizOptionsTable)
          .where(eq(quizOptionsTable.id, optionId))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Option not found" };
        }

        const [question] = await db
          .select({ tenantId: quizQuestionsTable.tenantId })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, existing.questionId))
          .limit(1);

        if (!question || question.tenantId !== tenantId) {
          return { type: "error" as const, error: "Option not found" };
        }

        const updateData: Record<string, unknown> = {};
        if (optionText !== undefined) updateData.optionText = optionText;
        if (isCorrect !== undefined) updateData.isCorrect = isCorrect;

        if (Object.keys(updateData).length === 0) {
          return { type: "error" as const, error: "No fields to update" };
        }

        await db.update(quizOptionsTable).set(updateData).where(eq(quizOptionsTable.id, optionId));

        logger.info("updateQuizOption executed", { optionId });
        return { type: "option_updated" as const, optionId, updatedFields: Object.keys(updateData) };
      },
    }),

    deleteQuizOption: tool({
      description: "Delete an option from a quiz question.",
      inputSchema: deleteQuizOptionSchema,
      execute: async ({ optionId }) => {
        const [existing] = await db
          .select({
            id: quizOptionsTable.id,
            questionId: quizOptionsTable.questionId,
          })
          .from(quizOptionsTable)
          .where(eq(quizOptionsTable.id, optionId))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Option not found" };
        }

        const [question] = await db
          .select({ tenantId: quizQuestionsTable.tenantId })
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, existing.questionId))
          .limit(1);

        if (!question || question.tenantId !== tenantId) {
          return { type: "error" as const, error: "Option not found" };
        }

        await db.delete(quizOptionsTable).where(eq(quizOptionsTable.id, optionId));

        logger.info("deleteQuizOption executed", { optionId });
        return { type: "option_deleted" as const, optionId };
      },
    }),

    generateQuizFromContent: tool({
      description: "Generate a quiz with AI-generated questions based on a video transcript or document content. Use this when user wants quizzes for their course content. The quiz will be created and optionally added to a module.",
      inputSchema: generateQuizFromContentSchema,
      execute: async ({ sourceType, sourceId, title, questionCount = 3, moduleId }) => {
        logger.info("generateQuizFromContent started", {
          sourceType,
          sourceId,
          questionCount,
          moduleId,
        });

        let content: string;
        let contentTitle: string;

        if (sourceType === "video") {
          const [video] = await db
            .select({
              id: videosTable.id,
              title: videosTable.title,
              videoKey: videosTable.videoKey,
              transcript: videosTable.transcript,
            })
            .from(videosTable)
            .where(
              and(
                eq(videosTable.id, sourceId),
                eq(videosTable.tenantId, tenantId)
              )
            )
            .limit(1);

          if (!video) {
            return { type: "error" as const, error: "Video not found" };
          }

          if (!video.videoKey) {
            return { type: "error" as const, error: "Video has no file uploaded" };
          }

          contentTitle = video.title;

          if (video.transcript) {
            content = video.transcript;
            logger.info("Using existing transcript", { videoId: video.id });
          } else {
            const videoUrl = getPresignedUrl(video.videoKey);
            logger.info("Transcribing video for quiz generation", { videoId: video.id });
            content = await transcribeVideo(videoUrl);

            await db
              .update(videosTable)
              .set({ transcript: content })
              .where(eq(videosTable.id, video.id));
          }
        } else {
          const [document] = await db
            .select({
              id: documentsTable.id,
              title: documentsTable.title,
              fileKey: documentsTable.fileKey,
              mimeType: documentsTable.mimeType,
            })
            .from(documentsTable)
            .where(
              and(
                eq(documentsTable.id, sourceId),
                eq(documentsTable.tenantId, tenantId)
              )
            )
            .limit(1);

          if (!document) {
            return { type: "error" as const, error: "Document not found" };
          }

          if (!document.fileKey) {
            return { type: "error" as const, error: "Document has no file uploaded" };
          }

          contentTitle = document.title;
          const documentUrl = getPresignedUrl(document.fileKey);
          logger.info("Extracting text from document for quiz generation", { documentId: document.id });
          content = await extractTextFromDocument(
            documentUrl,
            document.mimeType || "application/pdf"
          );
        }

        if (!content || content.length < 100) {
          return {
            type: "error" as const,
            error: "Content is too short to generate questions",
          };
        }

        const prompt = buildQuizPrompt(content, questionCount, []);

        logger.info("Generating quiz questions with AI", {
          sourceType,
          sourceId,
          contentLength: content.length,
          questionCount,
        });

        const { text: responseText } = await generateText({
          model: groq(AI_MODELS.QUIZ_GENERATION),
          prompt,
          maxOutputTokens: 4000,
          temperature: 0.7,
        });

        if (!responseText) {
          return {
            type: "error" as const,
            error: "Failed to generate questions from AI",
          };
        }

        const questions = parseGeneratedQuestions(responseText).slice(0, questionCount);

        if (questions.length === 0) {
          return {
            type: "error" as const,
            error: "AI generated no valid questions",
          };
        }

        const quizTitle = title || `Quiz: ${contentTitle}`;
        const quizText = `${quizTitle}`.trim();
        const embedding = await generateEmbedding(quizText);

        const [quiz] = await db
          .insert(quizzesTable)
          .values({
            tenantId,
            title: quizTitle,
            description: `Auto-generated quiz based on ${sourceType}: ${contentTitle}`,
            status: "published",
            embedding,
          })
          .returning();

        const questionValues = questions.map((q, i) => {
          const correctCount = q.options.filter((o) => o.isCorrect).length;
          return {
            quizId: quiz.id,
            tenantId,
            type: correctCount > 1 ? "multiple_select" as const : "multiple_choice" as const,
            questionText: q.questionText,
            explanation: q.explanation ?? null,
            order: i,
          };
        });

        const insertedQuestions = await db
          .insert(quizQuestionsTable)
          .values(questionValues)
          .returning();

        const optionValues = insertedQuestions.flatMap((question, i) =>
          questions[i].options.map((opt, j) => ({
            questionId: question.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: j,
          }))
        );

        if (optionValues.length > 0) {
          await db.insert(quizOptionsTable).values(optionValues);
        }

        let addedToModule = false;

        if (moduleId) {
          const [maxOrder] = await db
            .select({ maxOrder: moduleItemsTable.order })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, moduleId))
            .orderBy(desc(moduleItemsTable.order))
            .limit(1);

          await db.insert(moduleItemsTable).values({
            moduleId,
            contentType: "quiz",
            contentId: quiz.id,
            order: (maxOrder?.maxOrder ?? -1) + 1,
            isPreview: false,
          });

          addedToModule = true;
          logger.info("Quiz added to module", { quizId: quiz.id, moduleId });
        }

        logger.info("generateQuizFromContent completed", {
          quizId: quiz.id,
          questionsCount: questions.length,
          addedToModule,
        });

        return {
          type: "quiz_generated" as const,
          quizId: quiz.id,
          title: quiz.title,
          questionsCount: questions.length,
          addedToModule,
          moduleId: addedToModule ? moduleId : undefined,
        };
      },
    }),
  };
}
