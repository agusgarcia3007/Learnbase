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
  modulesTable,
  moduleItemsTable,
  coursesTable,
  courseModulesTable,
  categoriesTable,
  tenantAiProfilesTable,
} from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { aiGateway } from "@/lib/ai/gateway";
import { generateText, streamText } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import {
  COURSE_CHAT_SYSTEM_PROMPT,
  S3_KEYS_CONTEXT_MESSAGE,
  buildCoursesContextPrompt,
  buildTenantContextPrompt,
} from "@/lib/ai/prompts";
import { buildThumbnailPrompt } from "@/lib/ai/course-generation";
import { createCourseCreatorTools } from "@/lib/ai/tools";
import { getPresignedUrl, uploadBase64ToS3 } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const chatCreatorRoutes = new Elysia({ name: "ai-chat-creator" })
  .use(authPlugin)
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
      const { messages, contextCourseIds } = ctx.body;

      logger.info("Starting AI course chat", {
        tenantId,
        messageCount: messages.length,
        contextCourseIds: contextCourseIds?.length ?? 0,
      });

      const processedMessages: Array<{
        role: "user" | "assistant";
        content: string;
        imageKeys?: string[];
      }> = [];

      for (const m of messages) {
        if (m.attachments?.length) {
          const imageKeys = m.attachments.map((att) => att.key);
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

      let contextCoursesInfo = "";
      let validatedContextCourses: Array<{
        id: string;
        title: string;
        status: string;
        level: string | null;
        price: number;
        shortDescription: string | null;
        modules: Array<{ title: string; moduleId: string }>;
      }> = [];

      if (contextCourseIds?.length) {
        const contextCourses = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            status: coursesTable.status,
            level: coursesTable.level,
            price: coursesTable.price,
            shortDescription: coursesTable.shortDescription,
          })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.tenantId, tenantId),
              inArray(coursesTable.id, contextCourseIds)
            )
          );

        if (contextCourses.length !== contextCourseIds.length) {
          const foundIds = contextCourses.map((c) => c.id);
          const missingIds = contextCourseIds.filter((id) => !foundIds.includes(id));
          logger.warn("Context courses not found", { missingIds, tenantId });
          throw new AppError(
            ErrorCode.NOT_FOUND,
            `Courses not found: ${missingIds.join(", ")}`,
            404
          );
        }

        const courseModulesData = await db
          .select({
            courseId: courseModulesTable.courseId,
            moduleId: courseModulesTable.moduleId,
            order: courseModulesTable.order,
            moduleTitle: modulesTable.title,
          })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(inArray(courseModulesTable.courseId, contextCourseIds))
          .orderBy(courseModulesTable.order);

        validatedContextCourses = contextCourses.map((course) => ({
          ...course,
          modules: courseModulesData
            .filter((cm) => cm.courseId === course.id)
            .map((cm) => ({ title: cm.moduleTitle, moduleId: cm.moduleId })),
        }));

        contextCoursesInfo = buildCoursesContextPrompt(validatedContextCourses);
      }

      const [tenantProfile] = await db
        .select()
        .from(tenantAiProfilesTable)
        .where(eq(tenantAiProfilesTable.tenantId, tenantId))
        .limit(1);

      const tenantContext = buildTenantContextPrompt(tenantProfile);

      const tools = createCourseCreatorTools(
        tenantId,
        userId,
        searchCache,
        validatedContextCourses.length > 0 ? validatedContextCourses : undefined
      );

      const systemPrompt = `${COURSE_CHAT_SYSTEM_PROMPT}${tenantContext}${contextCoursesInfo ? `\n${contextCoursesInfo}` : ""}`;

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
                text: S3_KEYS_CONTEXT_MESSAGE(m.imageKeys),
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
        system: systemPrompt,
        messages: formattedMessages,
        tools,
        stopWhen: (event) => {
          return event.steps.length >= 20;
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
                  key: t.String(),
                })
              )
            ),
          })
        ),
        contextCourseIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
      }),
      detail: {
        tags: ["AI"],
        summary: "Conversational AI course creator with tool calling and course editing",
      },
    }
  )
  .post(
    "/courses/create-from-preview",
    async (ctx) => {
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
        const allItemsToInsert: Array<{
          moduleId: string;
          contentType: "video" | "document" | "quiz";
          contentId: string;
          order: number;
          isPreview: boolean;
        }> = [];

        const existingModuleIds = modules
          .filter((m) => m.id)
          .map((m) => m.id as string);

        const [existingModules, existingModuleItems] = await Promise.all([
          existingModuleIds.length > 0
            ? db
                .select({ id: modulesTable.id })
                .from(modulesTable)
                .where(
                  and(
                    eq(modulesTable.tenantId, tenantId),
                    inArray(modulesTable.id, existingModuleIds)
                  )
                )
            : [],
          existingModuleIds.length > 0
            ? db
                .select({
                  moduleId: moduleItemsTable.moduleId,
                  id: moduleItemsTable.id,
                })
                .from(moduleItemsTable)
                .where(inArray(moduleItemsTable.moduleId, existingModuleIds))
            : [],
        ]);

        const existingModuleSet = new Set(existingModules.map((m) => m.id));
        const modulesWithItems = new Set(existingModuleItems.map((i) => i.moduleId));

        const modulesToCreate: Array<{
          tenantId: string;
          title: string;
          description: string | null;
          status: "published";
          items: Array<{ type: "video" | "document" | "quiz"; id: string }>;
        }> = [];

        for (const moduleData of modules) {
          if (moduleData.id && existingModuleSet.has(moduleData.id)) {
            finalModuleIds.push(moduleData.id);

            if (!modulesWithItems.has(moduleData.id) && moduleData.items.length > 0) {
              logger.info("create-from-preview: adding items to existing empty module", {
                moduleId: moduleData.id,
                itemCount: moduleData.items.length,
              });

              for (let i = 0; i < moduleData.items.length; i++) {
                const item = moduleData.items[i];
                allItemsToInsert.push({
                  moduleId: moduleData.id,
                  contentType: item.type as "video" | "document" | "quiz",
                  contentId: item.id,
                  order: i,
                  isPreview: false,
                });
              }
            }
          } else {
            if (moduleData.id) {
              logger.warn("create-from-preview: module not found, will create new", {
                moduleId: moduleData.id,
              });
            }

            if (moduleData.items.length === 0) {
              logger.warn("create-from-preview: skipping module with no items", {
                title: moduleData.title,
              });
              continue;
            }

            modulesToCreate.push({
              tenantId,
              title: moduleData.title,
              description: moduleData.description ?? null,
              status: "published",
              items: moduleData.items.map((item) => ({
                type: item.type as "video" | "document" | "quiz",
                id: item.id,
              })),
            });
          }
        }

        if (modulesToCreate.length > 0) {
          const newModules = await db
            .insert(modulesTable)
            .values(
              modulesToCreate.map((m) => ({
                tenantId: m.tenantId,
                title: m.title,
                description: m.description,
                status: m.status,
              }))
            )
            .returning();

          for (let i = 0; i < newModules.length; i++) {
            const newModule = newModules[i];
            const moduleToCreate = modulesToCreate[i];

            finalModuleIds.push(newModule.id);

            for (let j = 0; j < moduleToCreate.items.length; j++) {
              const item = moduleToCreate.items[j];
              allItemsToInsert.push({
                moduleId: newModule.id,
                contentType: item.type,
                contentId: item.id,
                order: j,
                isPreview: false,
              });
            }

            logger.info("create-from-preview: created new module", {
              moduleId: newModule.id,
              title: newModule.title,
              itemCount: moduleToCreate.items.length,
            });
          }
        }

        if (allItemsToInsert.length > 0) {
          await db.insert(moduleItemsTable).values(allItemsToInsert);
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
              const imagePrompt = buildThumbnailPrompt(title, shortDescription, topics);

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
    },
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
    async (ctx) => {
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
          const imagePrompt = buildThumbnailPrompt(course.title, course.shortDescription || "", topics);

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
    },
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
    async (ctx) => {
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
    },
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
