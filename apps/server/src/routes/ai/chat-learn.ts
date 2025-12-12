import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  quizQuestionsTable,
  quizOptionsTable,
  modulesTable,
  moduleItemsTable,
  coursesTable,
  courseModulesTable,
  enrollmentsTable,
  tenantsTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { aiGateway } from "@/lib/ai/gateway";
import { streamText } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { buildLearnSystemPrompt } from "@/lib/ai/prompts";
import {
  createLearnAssistantTools,
  type LearnContext,
} from "@/lib/ai/tools/learn";
import { getPresignedUrl, uploadBase64ToS3 } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const chatLearnRoutes = new Elysia({ name: "ai-chat-learn" })
  .use(authPlugin)
  .post(
    "/learn/chat",
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

      const tenantId = ctx.user.tenantId;
      const userId = ctx.user.id;
      const { messages, context } = ctx.body;

      logger.info("Starting AI learn chat", {
        tenantId,
        userId,
        courseId: context.courseId,
        itemId: context.itemId,
        currentTime: context.currentTime,
      });

      const [enrollment] = await db
        .select({
          id: enrollmentsTable.id,
          progress: enrollmentsTable.progress,
        })
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.userId, userId),
            eq(enrollmentsTable.courseId, context.courseId),
            eq(enrollmentsTable.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!enrollment) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "User is not enrolled in this course",
          403
        );
      }

      const [tenant] = await db
        .select({ aiAssistantSettings: tenantsTable.aiAssistantSettings })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);

      const aiSettings = tenant?.aiAssistantSettings;

      if (aiSettings?.enabled === false) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "AI assistant is disabled for this organization",
          403
        );
      }

      const [course] = await db
        .select({
          id: coursesTable.id,
          title: coursesTable.title,
        })
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, context.courseId),
            eq(coursesTable.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!course) {
        throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
      }

      const courseModules = await db
        .select({
          moduleId: courseModulesTable.moduleId,
          order: courseModulesTable.order,
        })
        .from(courseModulesTable)
        .where(eq(courseModulesTable.courseId, context.courseId))
        .orderBy(courseModulesTable.order);

      const moduleIds = courseModules.map((cm) => cm.moduleId);

      const modulesData =
        moduleIds.length > 0
          ? await db
              .select({
                id: modulesTable.id,
                title: modulesTable.title,
              })
              .from(modulesTable)
              .where(inArray(modulesTable.id, moduleIds))
          : [];

      const moduleItems =
        moduleIds.length > 0
          ? await db
              .select({
                id: moduleItemsTable.id,
                moduleId: moduleItemsTable.moduleId,
                contentType: moduleItemsTable.contentType,
                contentId: moduleItemsTable.contentId,
                order: moduleItemsTable.order,
              })
              .from(moduleItemsTable)
              .where(inArray(moduleItemsTable.moduleId, moduleIds))
              .orderBy(moduleItemsTable.order)
          : [];

      const videoIds = moduleItems
        .filter((i) => i.contentType === "video")
        .map((i) => i.contentId);
      const documentIds = moduleItems
        .filter((i) => i.contentType === "document")
        .map((i) => i.contentId);
      const quizIds = moduleItems
        .filter((i) => i.contentType === "quiz")
        .map((i) => i.contentId);

      const [videosData, documentsData, quizzesData, quizQuestionsData] =
        await Promise.all([
          videoIds.length > 0
            ? db
                .select({
                  id: videosTable.id,
                  title: videosTable.title,
                  description: videosTable.description,
                  duration: videosTable.duration,
                  transcript: videosTable.transcript,
                })
                .from(videosTable)
                .where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db
                .select({
                  id: documentsTable.id,
                  title: documentsTable.title,
                  description: documentsTable.description,
                })
                .from(documentsTable)
                .where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db
                .select({
                  id: quizzesTable.id,
                  title: quizzesTable.title,
                  description: quizzesTable.description,
                })
                .from(quizzesTable)
                .where(inArray(quizzesTable.id, quizIds))
            : [],
          quizIds.length > 0
            ? db
                .select({
                  id: quizQuestionsTable.id,
                  quizId: quizQuestionsTable.quizId,
                  questionText: quizQuestionsTable.questionText,
                  type: quizQuestionsTable.type,
                  explanation: quizQuestionsTable.explanation,
                  order: quizQuestionsTable.order,
                })
                .from(quizQuestionsTable)
                .where(inArray(quizQuestionsTable.quizId, quizIds))
            : [],
        ]);

      const questionIds = quizQuestionsData.map((q) => q.id);
      const quizOptionsData =
        questionIds.length > 0
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
          : [];

      const contentMap = new Map<
        string,
        {
          title: string;
          description: string | null;
          duration?: number;
          transcript?: string | null;
        }
      >();
      for (const v of videosData) {
        contentMap.set(v.id, {
          title: v.title,
          description: v.description,
          duration: v.duration,
          transcript: v.transcript,
        });
      }
      for (const d of documentsData) {
        contentMap.set(d.id, { title: d.title, description: d.description });
      }
      for (const q of quizzesData) {
        const questions = quizQuestionsData
          .filter((qq) => qq.quizId === q.id)
          .sort((a, b) => a.order - b.order);

        const quizContent = questions
          .map((question, i) => {
            const options = quizOptionsData
              .filter((o) => o.questionId === question.id)
              .sort((a, b) => a.order - b.order);

            const optionsText = options
              .map(
                (o) =>
                  `  ${o.isCorrect ? "[CORRECT]" : "[ ]"} ${o.optionText}`
              )
              .join("\n");

            return `Question ${i + 1}: ${question.questionText}\n${optionsText}${
              question.explanation
                ? `\nExplanation: ${question.explanation}`
                : ""
            }`;
          })
          .join("\n\n");

        contentMap.set(q.id, {
          title: q.title,
          description: q.description,
          transcript: quizContent || null,
        });
      }

      const currentModuleItem = moduleItems.find(
        (mi) => mi.id === context.itemId
      );

      if (!currentModuleItem) {
        throw new AppError(ErrorCode.NOT_FOUND, "Module item not found", 404);
      }

      const currentContent = contentMap.get(currentModuleItem.contentId);

      const structuredModules = courseModules.map((cm) => {
        const moduleData = modulesData.find((m) => m.id === cm.moduleId);
        const items = moduleItems
          .filter((mi) => mi.moduleId === cm.moduleId)
          .map((mi) => {
            const content = contentMap.get(mi.contentId);
            return {
              id: mi.id,
              title: content?.title || "Unknown",
              type: mi.contentType,
            };
          });
        return {
          id: cm.moduleId,
          title: moduleData?.title || "Unknown",
          items,
        };
      });

      const learnContext: LearnContext = {
        courseId: context.courseId,
        courseTitle: course.title,
        enrollmentProgress: enrollment.progress,
        itemId: context.itemId,
        itemTitle: currentContent?.title || "Unknown",
        itemType: currentModuleItem.contentType as
          | "video"
          | "document"
          | "quiz",
        itemDescription: currentContent?.description || null,
        currentTime: context.currentTime,
        duration: currentContent?.duration || null,
        transcript: currentContent?.transcript || null,
        modules: structuredModules,
      };

      const tools = createLearnAssistantTools(tenantId, learnContext);

      const systemPrompt = buildLearnSystemPrompt({
        courseTitle: learnContext.courseTitle,
        enrollmentProgress: learnContext.enrollmentProgress,
        itemTitle: learnContext.itemTitle,
        itemType: learnContext.itemType,
        currentTime: learnContext.currentTime,
        modules: structuredModules.map((m) => ({
          title: m.title,
          items: m.items.map((i) => ({ title: i.title, type: i.type })),
        })),
        tenantAiSettings: aiSettings || undefined,
      });

      type ProcessedAttachment =
        | { type: "image"; key: string }
        | { type: "file"; data: string; mediaType: string };

      const processedMessages: Array<{
        role: "user" | "assistant";
        content: string;
        attachments?: ProcessedAttachment[];
      }> = [];

      for (const m of messages) {
        if (m.attachments?.length) {
          const attachments: ProcessedAttachment[] = await Promise.all(
            m.attachments.map(async (att) => {
              if (att.type === "image") {
                const key = await uploadBase64ToS3({
                  base64: att.data,
                  folder: "learn-chat-images",
                  userId,
                });
                return { type: "image" as const, key };
              }
              return {
                type: "file" as const,
                data: att.data,
                mediaType: att.mimeType,
              };
            })
          );
          processedMessages.push({
            role: m.role as "user" | "assistant",
            content: m.content,
            attachments,
          });
        } else {
          processedMessages.push({
            role: m.role as "user" | "assistant",
            content: m.content,
          });
        }
      }

      const formattedMessages = processedMessages.map((m) => {
        if (m.role === "user" && m.attachments?.length) {
          const contentParts: Array<
            | { type: "text"; text: string }
            | { type: "image"; image: string }
            | { type: "file"; data: string; mediaType: string }
          > = [{ type: "text" as const, text: m.content || " " }];

          for (const att of m.attachments) {
            if (att.type === "image") {
              contentParts.push({
                type: "image" as const,
                image: getPresignedUrl(att.key),
              });
            } else {
              contentParts.push({
                type: "file" as const,
                data: att.data,
                mediaType: att.mediaType,
              });
            }
          }

          return {
            role: "user" as const,
            content: contentParts,
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
        };
      });

      const result = streamText({
        model: aiGateway(AI_MODELS.COURSE_CHAT),
        system: systemPrompt,
        messages: formattedMessages,
        tools,
        stopWhen: (event) => event.steps.length >= 5,
        onStepFinish: (step) => {
          logger.info("AI learn chat step finished", {
            tenantId,
            userId,
            itemId: context.itemId,
            toolCalls: step.toolCalls?.length ?? 0,
            toolNames: step.toolCalls?.map((tc) => tc.toolName) ?? [],
          });
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "learn-chat-stream",
          metadata: {
            userId,
            tenantId,
            courseId: context.courseId,
            itemId: context.itemId,
          },
        },
      });

      return result.toUIMessageStreamResponse();
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.Union([t.Literal("user"), t.Literal("assistant")]),
            content: t.String(),
            attachments: t.Optional(
              t.Array(
                t.Object({
                  type: t.Union([t.Literal("image"), t.Literal("file")]),
                  data: t.String(),
                  mimeType: t.String(),
                  fileName: t.Optional(t.String()),
                })
              )
            ),
          })
        ),
        context: t.Object({
          courseId: t.String({ format: "uuid" }),
          itemId: t.String({ format: "uuid" }),
          currentTime: t.Number(),
        }),
      }),
      detail: {
        tags: ["AI"],
        summary: "Learning assistant chat with course context",
      },
    }
  );
