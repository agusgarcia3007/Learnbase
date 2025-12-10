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
  quizQuestionsTable,
  modulesTable,
  moduleItemsTable,
  coursesTable,
  courseModulesTable,
  categoriesTable,
} from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { groq } from "@/lib/ai/groq";
import { aiGateway } from "@/lib/ai/gateway";
import { generateText, generateObject, streamText } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/models";
import {
  promptKeys,
  THEME_GENERATION_PROMPT,
  THUMBNAIL_GENERATION_PROMPT,
  COURSE_CHAT_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { getLangfuseClient } from "@/lib/ai/langfuse";
import { transcribeVideo } from "@/lib/ai/transcript";
import { extractTextFromDocument } from "@/lib/ai/document-extract";
import {
  buildQuizPromptVariables,
  parseGeneratedQuestions,
} from "@/lib/ai/quiz-generation";
import {
  buildCoursePrompt,
  buildThumbnailPrompt,
  parseGeneratedCourse,
  type CourseContentItem,
} from "@/lib/ai/course-generation";
import { hexToOklch } from "@/lib/ai/color-utils";
import { createCourseCreatorTools } from "@/lib/ai/tools";
import { getPresignedUrl, uploadBase64ToS3 } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const aiRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/videos/analyze",
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

        const { videoKey } = ctx.body;
        const videoUrl = getPresignedUrl(videoKey);

        logger.info("Starting video analysis", { videoKey });

        const langfuse = getLangfuseClient();
        const videoAnalysisPrompt = await langfuse.prompt.get(
          promptKeys.VIDEO_ANALYSIS_PROMPT
        );

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
              system: videoAnalysisPrompt.prompt,
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

        return { title, description };
      }),
    {
      body: t.Object({
        videoKey: t.String(),
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

        const langfuse = getLangfuseClient();
        const quizPromptData = await langfuse.prompt.get(
          promptKeys.QUIZ_GENERATION_PROMPT
        );

        const questions = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "quiz-generation",
            metadata: { quizId: quiz.id, sourceType },
          },
          async () => {
            const promptVariables = buildQuizPromptVariables(
              content,
              count,
              existingTexts
            );
            const prompt = quizPromptData.compile(promptVariables);
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
  )
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
  )
  .post(
    "/themes/generate",
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
            "Only owners and admins can generate themes",
            403
          );
        }

        const { primaryColor, style } = ctx.body;

        type StyleConfig = {
          chroma: string;
          radius: string;
          secondary: string;
          accent: string;
          fontHeading: string;
          fontBody: string;
          shadowStyle: string;
        };

        const styleConfigs: Record<string, StyleConfig> = {
          retro: {
            chroma: "muted (0.08-0.12)",
            radius: "0.25rem",
            secondary: "warm beige/cream tones",
            accent: "warm muted complement",
            fontHeading: "Playfair Display",
            fontBody: "Lora",
            shadowStyle: "soft, warm-tinted shadows with sepia undertones",
          },
          vintage: {
            chroma: "muted (0.08-0.12)",
            radius: "0.25rem",
            secondary: "warm sepia tones",
            accent: "dusty warm color",
            fontHeading: "Cormorant Garamond",
            fontBody: "Source Serif Pro",
            shadowStyle: "soft, diffuse shadows with warm brown tint",
          },
          modern: {
            chroma: "vibrant (0.15-0.22)",
            radius: "0.5rem",
            secondary: "neutral gray",
            accent: "same hue, higher chroma",
            fontHeading: "Inter",
            fontBody: "Inter",
            shadowStyle: "crisp, clean shadows with neutral gray color",
          },
          minimal: {
            chroma: "clean (0.12-0.18)",
            radius: "0.375rem",
            secondary: "very light neutral",
            accent: "subtle primary variant",
            fontHeading: "Plus Jakarta Sans",
            fontBody: "Plus Jakarta Sans",
            shadowStyle: "subtle, barely visible shadows for depth",
          },
          corporate: {
            chroma: "conservative (0.10-0.15)",
            radius: "0.375rem",
            secondary: "cool professional gray",
            accent: "trustworthy blue tone",
            fontHeading: "Roboto",
            fontBody: "Open Sans",
            shadowStyle: "professional, medium shadows with cool gray tone",
          },
          professional: {
            chroma: "conservative (0.10-0.15)",
            radius: "0.375rem",
            secondary: "neutral slate",
            accent: "subtle complement",
            fontHeading: "Source Sans Pro",
            fontBody: "Source Sans Pro",
            shadowStyle: "clean, balanced shadows with neutral color",
          },
          playful: {
            chroma: "bright (0.20-0.30)",
            radius: "1rem",
            secondary: "vibrant complement",
            accent: "bright contrasting color",
            fontHeading: "Fredoka",
            fontBody: "Nunito",
            shadowStyle: "bold, colorful shadows tinted with primary color",
          },
          fun: {
            chroma: "saturated (0.22-0.30)",
            radius: "1rem",
            secondary: "energetic complement",
            accent: "pop of bright color",
            fontHeading: "Baloo 2",
            fontBody: "Quicksand",
            shadowStyle: "bold, vibrant shadows with color accent",
          },
          futuristic: {
            chroma: "neon (0.25-0.35)",
            radius: "0rem",
            secondary: "dark cool gray",
            accent: "bright neon/cyan",
            fontHeading: "Space Grotesk",
            fontBody: "JetBrains Mono",
            shadowStyle: "neon glow effect with cyan/blue tint and large spread",
          },
          elegant: {
            chroma: "refined (0.12-0.18)",
            radius: "0.5rem",
            secondary: "warm neutral",
            accent: "gold or rose tone",
            fontHeading: "Cormorant",
            fontBody: "Lato",
            shadowStyle: "refined, subtle shadows with warm undertones",
          },
          luxury: {
            chroma: "rich (0.14-0.20)",
            radius: "0.5rem",
            secondary: "deep warm neutral",
            accent: "gold or champagne",
            fontHeading: "Playfair Display",
            fontBody: "Montserrat",
            shadowStyle: "rich, deep shadows with slight gold/warm tint",
          },
        };

        const normalizedStyle = style?.toLowerCase().trim() || "";
        const styleConfig = styleConfigs[normalizedStyle] || styleConfigs.modern;

        const primaryOklch = primaryColor ? hexToOklch(primaryColor) : null;

        const colorInstruction = primaryOklch
          ? `Use EXACTLY this value as primary: ${primaryOklch}. Do not modify.`
          : `Choose a creative color for style "${style || "modern"}" with chroma ${styleConfig.chroma}`;

        logger.info("Generating custom theme with AI", {
          tenantId: ctx.user.tenantId,
          hasPrimaryColor: !!primaryColor,
          style: style || "default",
        });

        const generationStart = Date.now();

        const themeSchema = z.object({
          primary: z.string().describe(
            `Primary color in oklch(L C H) format. ${colorInstruction}`
          ),
          primaryForeground: z.string().describe(
            "Text on primary buttons. If primary L < 0.6, use oklch(0.98 0 0). If primary L >= 0.6, use oklch(0.15 0 0)."
          ),
          secondary: z.string().describe(
            `Card/container background. MUST be very light with minimal saturation: L between 0.94-0.97, C between 0.005-0.02. Example: oklch(0.96 0.01 ${primaryOklch ? "same-hue-as-primary" : "220"})`
          ),
          secondaryForeground: z.string().describe(
            "Text on secondary backgrounds. Must be dark for contrast: oklch(0.20 0.02 H) where H matches theme hue."
          ),
          accent: z.string().describe(
            `Accent for badges/highlights. ${styleConfig.accent}. Should complement primary - try analogous (+/-30 hue) or complementary (+180 hue).`
          ),
          accentForeground: z.string().describe(
            "Text on accent. If accent L < 0.6, use oklch(0.98 0 0). If accent L >= 0.6, use oklch(0.15 0 0)."
          ),
          ring: z.string().describe(
            "Focus ring with alpha. Format: oklch(L C H / 0.15). Use same H as primary, L around 0.6."
          ),
          radius: z.string().describe(
            `Border radius. Use exactly: ${styleConfig.radius}`
          ),
          primaryDark: z.string().describe(
            "Dark mode primary. Same hue and chroma, increase L by 0.08-0.12 for visibility on dark backgrounds."
          ),
          primaryForegroundDark: z.string().describe(
            "Dark mode text on primary. Usually oklch(0.98 0 0) for dark backgrounds."
          ),
          secondaryDark: z.string().describe(
            "Dark mode card background. MUST be dark: L between 0.16-0.20, C between 0.005-0.02. Example: oklch(0.18 0.01 H)"
          ),
          secondaryForegroundDark: z.string().describe(
            "Dark mode text on secondary. Must be light: oklch(0.90 0.01 H)"
          ),
          accentDark: z.string().describe(
            "Dark mode accent. Same hue as accent, increase L by 0.05-0.10."
          ),
          accentForegroundDark: z.string().describe(
            "Dark mode text on accent. Match accentForeground logic."
          ),
          ringDark: z.string().describe(
            "Dark mode focus ring. Format: oklch(L C H / 0.25). Same H as primary, L around 0.7."
          ),
          fontHeading: z.string().describe(
            `Heading font. Use exactly: "${styleConfig.fontHeading}"`
          ),
          fontBody: z.string().describe(
            `Body font. Use exactly: "${styleConfig.fontBody}"`
          ),
          shadow: z.string().describe(
            `Card shadow for ${style || "modern"} style. CSS box-shadow format. Style: ${styleConfig.shadowStyle}. Example: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`
          ),
          shadowLg: z.string().describe(
            `Large shadow for modals/dropdowns. Same style as shadow but more prominent. Example: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)`
          ),
        });

        const theme = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "theme-generation",
            metadata: { style: style || "default" },
          },
          async () => {
            const { object } = await generateObject({
              model: aiGateway(AI_MODELS.THEME_GENERATION),
              prompt: THEME_GENERATION_PROMPT,
              schema: themeSchema,
              temperature: 0.7,
              ...createTelemetryConfig("theme-color-generation"),
            });

            const generationTime = Date.now() - generationStart;

            logger.info("Theme generation completed", {
              generationTime: `${generationTime}ms`,
            });

            return object;
          }
        );

        return { theme };
      }),
    {
      body: t.Object({
        primaryColor: t.Optional(t.String()),
        style: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate a custom color theme using AI",
      },
    }
  )
  .post(
    "/courses/chat",
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
        ctx.userRole === "admin" ||
        ctx.userRole === "superadmin";

      if (!canManage) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and admins can use AI course creator",
          403
        );
      }

      const tenantId = ctx.user.tenantId;
      const userId = ctx.user.id;
      const { messages } = ctx.body;

      logger.info("Starting AI course chat", {
        tenantId,
        messageCount: messages.length,
      });

      const processedMessages: Array<{
        role: "user" | "assistant";
        content: string;
        imageKeys?: string[];
      }> = [];

      for (const m of messages) {
        if (m.attachments?.length) {
          const imageKeys = await Promise.all(
            m.attachments.map((att) =>
              uploadBase64ToS3({
                base64: att.data,
                folder: "chat-images",
                userId,
              })
            )
          );
          processedMessages.push({
            role: m.role as "user" | "assistant",
            content: m.content,
            imageKeys,
          });
        } else {
          processedMessages.push({
            role: m.role as "user" | "assistant",
            content: m.content,
          });
        }
      }

      const searchCache = new Map<string, unknown>();
      const tools = createCourseCreatorTools(tenantId, searchCache);

      const formattedMessages = processedMessages.map((m) => {
        if (m.role === "user" && m.imageKeys?.length) {
          return {
            role: "user" as const,
            content: [
              { type: "text" as const, text: m.content || " " },
              ...m.imageKeys.map((key) => ({
                type: "image" as const,
                image: getPresignedUrl(key),
              })),
              {
                type: "text" as const,
                text: `[S3 keys disponibles para usar como thumbnail: ${m.imageKeys.join(", ")}]`,
              },
            ],
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
        };
      });

      const result = streamText({
        model: aiGateway(AI_MODELS.COURSE_CHAT),
        system: COURSE_CHAT_SYSTEM_PROMPT,
        messages: formattedMessages,
        tools,
        stopWhen: (event) => {
          if (event.steps.length >= 20) return true;

          const hasCreateCourse = event.steps.some((s) =>
            s.toolCalls?.some((tc) => tc.toolName === "createCourse")
          );

          if (!hasCreateCourse) return false;

          const lastCreateCourseStep = [...event.steps]
            .reverse()
            .find((s) => s.toolCalls?.some((tc) => tc.toolName === "createCourse"));

          if (!lastCreateCourseStep) return false;

          const lastIndex = event.steps.indexOf(lastCreateCourseStep);
          return event.steps.length > lastIndex + 1;
        },
        onStepFinish: (step) => {
          logger.info("AI chat step finished", {
            tenantId,
            toolCalls: step.toolCalls?.length ?? 0,
            toolNames: step.toolCalls?.map((tc) => tc.toolName) ?? [],
          });
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "course-chat-stream",
          metadata: {
            userId,
            tenantId,
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
                  type: t.Literal("image"),
                  data: t.String(),
                  mimeType: t.String(),
                })
              )
            ),
          })
        ),
      }),
      detail: {
        tags: ["AI"],
        summary: "Conversational AI course creator with tool calling",
      },
    }
  )
  .post(
    "/courses/create-from-preview",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create courses",
            403
          );
        }

        const tenantId = ctx.user.tenantId;
        const { title, shortDescription, description, level, objectives, requirements, features, modules, categoryId } = ctx.body;

        logger.info("Creating course from AI preview", {
          tenantId,
          title,
          moduleCount: modules.length,
        });

        let slug = title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const existingCourse = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(and(eq(coursesTable.tenantId, tenantId), eq(coursesTable.slug, slug)))
          .limit(1);

        if (existingCourse.length > 0) {
          slug = `${slug}-${Date.now()}`;
          logger.info("create-from-preview: slug collision, using unique slug", { slug });
        }

        let validCategoryId: string | null = null;
        if (categoryId) {
          const [category] = await db
            .select({ id: categoriesTable.id })
            .from(categoriesTable)
            .where(
              and(
                eq(categoriesTable.tenantId, tenantId),
                eq(categoriesTable.id, categoryId)
              )
            )
            .limit(1);

          if (category) {
            validCategoryId = category.id;
          } else {
            logger.warn("create-from-preview: invalid categoryId, ignoring", { categoryId });
          }
        }

        const [maxOrder] = await db
          .select({ maxOrder: coursesTable.order })
          .from(coursesTable)
          .where(eq(coursesTable.tenantId, tenantId))
          .orderBy(desc(coursesTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const [course] = await db
          .insert(coursesTable)
          .values({
            tenantId,
            slug,
            title,
            shortDescription,
            description,
            level,
            objectives,
            requirements,
            features,
            status: "draft",
            order: nextOrder,
            price: 0,
            currency: "USD",
            language: "es",
            categoryId: validCategoryId,
          })
          .returning();

        const finalModuleIds: string[] = [];

        for (const moduleData of modules) {
          if (moduleData.id) {
            const [existingModule] = await db
              .select({ id: modulesTable.id })
              .from(modulesTable)
              .where(
                and(
                  eq(modulesTable.tenantId, tenantId),
                  eq(modulesTable.id, moduleData.id)
                )
              )
              .limit(1);

            if (existingModule) {
              const existingItems = await db
                .select({ id: moduleItemsTable.id })
                .from(moduleItemsTable)
                .where(eq(moduleItemsTable.moduleId, existingModule.id))
                .limit(1);

              if (existingItems.length === 0 && moduleData.items.length > 0) {
                logger.info("create-from-preview: adding items to existing empty module", {
                  moduleId: existingModule.id,
                  itemCount: moduleData.items.length,
                });

                for (let i = 0; i < moduleData.items.length; i++) {
                  const item = moduleData.items[i];
                  await db.insert(moduleItemsTable).values({
                    moduleId: existingModule.id,
                    contentType: item.type,
                    contentId: item.id,
                    order: i,
                    isPreview: false,
                  });
                }
              }

              finalModuleIds.push(existingModule.id);
            } else {
              logger.warn("create-from-preview: module not found, will create new", {
                moduleId: moduleData.id,
              });
            }
          }

          if (!moduleData.id || !finalModuleIds.includes(moduleData.id)) {
            if (moduleData.items.length === 0) {
              logger.warn("create-from-preview: skipping module with no items", {
                title: moduleData.title,
              });
              continue;
            }

            const [newModule] = await db
              .insert(modulesTable)
              .values({
                tenantId,
                title: moduleData.title,
                description: moduleData.description ?? null,
                status: "published",
              })
              .returning();

            for (let i = 0; i < moduleData.items.length; i++) {
              const item = moduleData.items[i];
              await db.insert(moduleItemsTable).values({
                moduleId: newModule.id,
                contentType: item.type,
                contentId: item.id,
                order: i,
                isPreview: false,
              });
            }

            logger.info("create-from-preview: created new module", {
              moduleId: newModule.id,
              title: newModule.title,
              itemCount: moduleData.items.length,
            });

            finalModuleIds.push(newModule.id);
          }
        }

        if (finalModuleIds.length > 0) {
          const moduleInserts = finalModuleIds.map((moduleId, index) => ({
            courseId: course.id,
            moduleId,
            order: index,
          }));

          await db.insert(courseModulesTable).values(moduleInserts);
        }

        let thumbnailKey: string | null = null;
        try {
          thumbnailKey = await withUserContext(
            {
              userId: ctx.user!.id,
              tenantId: tenantId,
              operationName: "course-thumbnail-from-preview",
              metadata: { courseId: course.id },
            },
            async () => {
              const topics = modules.slice(0, 5).map((m) => m.title);
              const imagePrompt = THUMBNAIL_GENERATION_PROMPT
                .replace("{{title}}", title)
                .replace("{{description}}", shortDescription)
                .replace("{{topics}}", topics.join(", "));

              logger.info("Generating course thumbnail with AI Gateway");
              const imageStart = Date.now();

              const imageResult = await generateText({
                model: aiGateway(AI_MODELS.IMAGE_GENERATION),
                prompt: imagePrompt,
                ...createTelemetryConfig("thumbnail-from-preview"),
              });

              const imageTime = Date.now() - imageStart;
              logger.info("Thumbnail generation completed", {
                imageTime: `${imageTime}ms`,
              });

              const imageFile = imageResult.files?.find((f) =>
                f.mediaType.startsWith("image/")
              );

              if (imageFile?.base64) {
                const base64Data = `data:${imageFile.mediaType};base64,${imageFile.base64}`;
                const key = await uploadBase64ToS3({
                  base64: base64Data,
                  folder: `courses/${course.id}`,
                  userId: ctx.user!.id,
                });

                await db
                  .update(coursesTable)
                  .set({ thumbnail: key })
                  .where(eq(coursesTable.id, course.id));

                return key;
              }
              return null;
            }
          );
        } catch (error) {
          logger.warn("Thumbnail generation failed, continuing without thumbnail", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        logger.info("Course created from AI preview", {
          courseId: course.id,
          moduleCount: finalModuleIds.length,
          hasThumbnail: !!thumbnailKey,
        });

        return {
          course: {
            ...course,
            thumbnail: thumbnailKey ? getPresignedUrl(thumbnailKey) : null,
            modulesCount: finalModuleIds.length,
          },
        };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        shortDescription: t.String(),
        description: t.String(),
        level: t.Union([
          t.Literal("beginner"),
          t.Literal("intermediate"),
          t.Literal("advanced"),
        ]),
        objectives: t.Array(t.String()),
        requirements: t.Array(t.String()),
        features: t.Array(t.String()),
        categoryId: t.Optional(t.String()),
        modules: t.Array(
          t.Object({
            id: t.Optional(t.String()),
            title: t.String(),
            description: t.Optional(t.String()),
            items: t.Array(
              t.Object({
                type: t.Union([
                  t.Literal("video"),
                  t.Literal("document"),
                  t.Literal("quiz"),
                ]),
                id: t.String(),
                title: t.String(),
              })
            ),
          })
        ),
      }),
      detail: {
        tags: ["AI"],
        summary: "Create a course from AI-generated preview",
      },
    }
  )
  .post(
    "/courses/:courseId/thumbnail",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can generate thumbnails",
            403
          );
        }

        const tenantId = ctx.user.tenantId;
        const { courseId } = ctx.params;

        const [course] = await db
          .select()
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!course) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        logger.info("Generating thumbnail for course", { courseId, title: course.title });

        const courseModules = await db
          .select({ moduleId: courseModulesTable.moduleId })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.courseId, courseId));

        const moduleIds = courseModules.map((m) => m.moduleId);

        let topics: string[] = [];
        if (moduleIds.length > 0) {
          const moduleItems = await db
            .select({
              contentType: moduleItemsTable.contentType,
              contentId: moduleItemsTable.contentId,
            })
            .from(moduleItemsTable)
            .where(inArray(moduleItemsTable.moduleId, moduleIds));

          const videoIds = moduleItems
            .filter((i) => i.contentType === "video")
            .map((i) => i.contentId);

          if (videoIds.length > 0) {
            const videos = await db
              .select({ title: videosTable.title })
              .from(videosTable)
              .where(inArray(videosTable.id, videoIds))
              .limit(5);
            topics = videos.map((v) => v.title);
          }
        }

        if (topics.length === 0) {
          topics = [course.title];
        }

        return withUserContext(
          {
            userId: ctx.user!.id,
            tenantId: tenantId,
            operationName: "course-thumbnail-regeneration",
            metadata: { courseId },
          },
          async () => {
            const imagePrompt = THUMBNAIL_GENERATION_PROMPT
              .replace("{{title}}", course.title)
              .replace("{{description}}", course.shortDescription || "")
              .replace("{{topics}}", topics.join(", "));

            const imageStart = Date.now();
            const imageResult = await generateText({
              model: aiGateway(AI_MODELS.IMAGE_GENERATION),
              prompt: imagePrompt,
              ...createTelemetryConfig("thumbnail-regeneration"),
            });

            const imageTime = Date.now() - imageStart;
            logger.info("Thumbnail generation completed", { courseId, imageTime: `${imageTime}ms` });

            const imageFile = imageResult.files?.find((f) =>
              f.mediaType.startsWith("image/")
            );

            if (!imageFile?.base64) {
              logger.warn("No image returned from AI Gateway", {
                courseId,
                hasFiles: !!imageResult.files,
                fileCount: imageResult.files?.length ?? 0,
              });
              return { success: false, error: "No image generated" };
            }

            const base64Data = `data:${imageFile.mediaType};base64,${imageFile.base64}`;
            const thumbnailKey = await uploadBase64ToS3({
              base64: base64Data,
              folder: `courses/${courseId}`,
              userId: ctx.user!.id,
            });

            await db
              .update(coursesTable)
              .set({ thumbnail: thumbnailKey })
              .where(eq(coursesTable.id, courseId));

            logger.info("Thumbnail uploaded for course", { courseId, thumbnailKey });

            return {
              success: true,
              thumbnailUrl: getPresignedUrl(thumbnailKey),
            };
          }
        );
      }),
    {
      params: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate and upload thumbnail for an existing course",
      },
    }
  )
  .post(
    "/thumbnail/generate",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can generate thumbnails",
            403
          );
        }

        const { title, description } = ctx.body;

        logger.info("Generating standalone thumbnail", { title });

        return withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId || "no-tenant",
            operationName: "standalone-thumbnail",
            metadata: { title },
          },
          async () => {
            const imagePrompt = buildThumbnailPrompt(title, description || "", [title]);

            const imageStart = Date.now();
            const imageResult = await generateText({
              model: aiGateway(AI_MODELS.IMAGE_GENERATION),
              prompt: imagePrompt,
              ...createTelemetryConfig("standalone-thumbnail"),
            });

            const imageTime = Date.now() - imageStart;
            logger.info("Standalone thumbnail generation completed", {
              imageTime: `${imageTime}ms`,
            });

            const imageFile = imageResult.files?.find((f) =>
              f.mediaType.startsWith("image/")
            );

            if (!imageFile?.base64) {
              logger.warn("No image returned from AI Gateway");
              throw new AppError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Failed to generate thumbnail",
                500
              );
            }

            return {
              thumbnail: `data:${imageFile.mediaType};base64,${imageFile.base64}`,
            };
          }
        );
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate a thumbnail image from title and description",
      },
    }
  );
