import { tool, generateText } from "ai";
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  modulesTable,
  moduleItemsTable,
  coursesTable,
  courseModulesTable,
  categoriesTable,
  courseCategoriesTable,
  instructorsTable,
  enrollmentsTable,
} from "@/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { aiGateway } from "@/lib/ai/gateway";
import { AI_MODELS } from "@/lib/ai/models";
import { THUMBNAIL_GENERATION_PROMPT } from "@/lib/ai/prompts";
import { uploadBase64ToS3, getPresignedUrl } from "@/lib/upload";
import {
  generateCoursePreviewSchema,
  createCourseSchema,
  getCourseSchema,
  updateCourseSchema,
  updateCourseModulesSchema,
  publishCourseSchema,
  unpublishCourseSchema,
  deleteCourseSchema,
  regenerateThumbnailSchema,
} from "./schemas";
import { type ToolContext } from "./utils";

export function createCourseTools(ctx: ToolContext) {
  const { tenantId, userId } = ctx;

  return {
    generateCoursePreview: tool({
      description:
        "Generate a course preview with all the gathered information. Call this to show the user a preview before creating the course.",
      inputSchema: generateCoursePreviewSchema,
      execute: async (params) => {
        logger.info("generateCoursePreview executed", {
          title: params.title,
          moduleCount: params.modules.length,
        });

        return {
          type: "course_preview" as const,
          ...params,
        };
      },
    }),

    createCourse: tool({
      description:
        "Create the final course with all modules. Call this ONLY after the user confirms the preview. Course is created as draft for admin review.",
      inputSchema: createCourseSchema,
      execute: async ({
        title,
        shortDescription,
        description,
        level,
        objectives,
        requirements,
        features,
        moduleIds,
        categoryIds,
        price,
        currency,
        customThumbnailKey,
        previewVideoUrl,
      }) => {
        try {
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
            logger.info("createCourse: slug collision, using unique slug", { slug });
          }

          let validModuleIds = moduleIds;
          if (moduleIds.length > 0) {
            const validModules = await db
              .select({ id: modulesTable.id })
              .from(modulesTable)
              .where(
                and(
                  eq(modulesTable.tenantId, tenantId),
                  inArray(modulesTable.id, moduleIds)
                )
              );

            validModuleIds = validModules.map((m) => m.id);
            const invalidIds = moduleIds.filter((id) => !validModuleIds.includes(id));

            if (invalidIds.length > 0) {
              logger.warn("createCourse: invalid module IDs filtered", {
                invalidIds,
                validCount: validModuleIds.length,
              });
            }
          }

          let validCategoryIds: string[] = [];
          if (categoryIds && categoryIds.length > 0) {
            const validCategories = await db
              .select({ id: categoriesTable.id })
              .from(categoriesTable)
              .where(
                and(
                  eq(categoriesTable.tenantId, tenantId),
                  inArray(categoriesTable.id, categoryIds)
                )
              );

            validCategoryIds = validCategories.map((c) => c.id);
            const invalidIds = categoryIds.filter((id) => !validCategoryIds.includes(id));

            if (invalidIds.length > 0) {
              logger.warn("createCourse: invalid category IDs filtered", {
                invalidIds,
                validCount: validCategoryIds.length,
              });
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
              price: price ?? 0,
              currency: currency ?? "USD",
              language: "es",
              thumbnail: customThumbnailKey ?? null,
              previewVideoUrl: previewVideoUrl ?? null,
            })
            .returning();

          if (validModuleIds.length > 0) {
            const moduleInserts = validModuleIds.map((moduleId, index) => ({
              courseId: course.id,
              moduleId,
              order: index,
            }));

            await db.insert(courseModulesTable).values(moduleInserts);
          }

          if (validCategoryIds.length > 0) {
            await db.insert(courseCategoriesTable).values(
              validCategoryIds.map((categoryId) => ({
                courseId: course.id,
                categoryId,
              }))
            );
          }

          logger.info("createCourse executed", {
            courseId: course.id,
            title: course.title,
            moduleCount: validModuleIds.length,
            categoryCount: validCategoryIds.length,
          });

          return {
            type: "course_created" as const,
            courseId: course.id,
            title: course.title,
            slug: course.slug,
            modulesCount: validModuleIds.length,
            moduleIds: validModuleIds,
            categoriesCount: validCategoryIds.length,
            hasCustomThumbnail: !!customThumbnailKey,
          };
        } catch (error) {
          logger.error("createCourse failed", {
            error: error instanceof Error ? error.message : String(error),
            title,
            moduleIds,
            categoryIds,
          });

          return {
            type: "error" as const,
            error: "Failed to create course. Please try again.",
            details: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    getCourse: tool({
      description: "Get full course details including modules and items. Use this to understand the current state of a course before making edits. IMPORTANT: If REFERENCED COURSES section exists in context, use those exact courseId UUIDs.",
      inputSchema: getCourseSchema,
      execute: async ({ courseId }) => {
        const isInContext = ctx.contextCourses?.some((c) => c.id === courseId);
        logger.info("getCourse called", {
          courseId,
          isInContext,
          contextCourseIds: ctx.contextCourses?.map((c) => c.id),
        });

        const [courseResult] = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            slug: coursesTable.slug,
            description: coursesTable.description,
            shortDescription: coursesTable.shortDescription,
            status: coursesTable.status,
            level: coursesTable.level,
            price: coursesTable.price,
            originalPrice: coursesTable.originalPrice,
            currency: coursesTable.currency,
            language: coursesTable.language,
            tags: coursesTable.tags,
            features: coursesTable.features,
            requirements: coursesTable.requirements,
            objectives: coursesTable.objectives,
            includeCertificate: coursesTable.includeCertificate,
            instructorId: coursesTable.instructorId,
          })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!courseResult) {
          const hint = ctx.contextCourses?.length
            ? `Available context course IDs: ${ctx.contextCourses.map((c) => c.id).join(", ")}`
            : "No context courses available";
          logger.warn("getCourse: course not found", { courseId, hint });
          return {
            type: "error" as const,
            error: "Course not found",
            hint,
          };
        }

        const categoriesData = await db
          .select({
            id: categoriesTable.id,
            name: categoriesTable.name,
          })
          .from(courseCategoriesTable)
          .innerJoin(categoriesTable, eq(courseCategoriesTable.categoryId, categoriesTable.id))
          .where(eq(courseCategoriesTable.courseId, courseId));

        let instructorName: string | null = null;
        if (courseResult.instructorId) {
          const [inst] = await db
            .select({ name: instructorsTable.name })
            .from(instructorsTable)
            .where(eq(instructorsTable.id, courseResult.instructorId))
            .limit(1);
          instructorName = inst?.name ?? null;
        }

        const courseModulesData = await db
          .select({
            id: courseModulesTable.id,
            moduleId: courseModulesTable.moduleId,
            order: courseModulesTable.order,
            moduleTitle: modulesTable.title,
            moduleDescription: modulesTable.description,
          })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(eq(courseModulesTable.courseId, courseId))
          .orderBy(courseModulesTable.order);

        const moduleIds = courseModulesData.map((cm) => cm.moduleId);
        const moduleItemsData = moduleIds.length > 0
          ? await db
              .select({
                id: moduleItemsTable.id,
                moduleId: moduleItemsTable.moduleId,
                contentType: moduleItemsTable.contentType,
                contentId: moduleItemsTable.contentId,
                order: moduleItemsTable.order,
                isPreview: moduleItemsTable.isPreview,
              })
              .from(moduleItemsTable)
              .where(inArray(moduleItemsTable.moduleId, moduleIds))
              .orderBy(moduleItemsTable.order)
          : [];

        const videoIds = moduleItemsData.filter((i) => i.contentType === "video").map((i) => i.contentId);
        const documentIds = moduleItemsData.filter((i) => i.contentType === "document").map((i) => i.contentId);
        const quizIds = moduleItemsData.filter((i) => i.contentType === "quiz").map((i) => i.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id, title: videosTable.title }).from(videosTable).where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id, title: documentsTable.title }).from(documentsTable).where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id, title: quizzesTable.title }).from(quizzesTable).where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const contentTitles = new Map<string, string>();
        for (const v of videos) contentTitles.set(v.id, v.title);
        for (const d of documents) contentTitles.set(d.id, d.title);
        for (const q of quizzes) contentTitles.set(q.id, q.title);

        const modulesWithItems = courseModulesData.map((cm) => ({
          id: cm.id,
          moduleId: cm.moduleId,
          order: cm.order,
          title: cm.moduleTitle,
          description: cm.moduleDescription,
          items: moduleItemsData
            .filter((item) => item.moduleId === cm.moduleId)
            .map((item) => ({
              id: item.id,
              contentType: item.contentType,
              contentId: item.contentId,
              title: contentTitles.get(item.contentId) ?? "Unknown",
              order: item.order,
              isPreview: item.isPreview,
            })),
        }));

        logger.info("getCourse executed", { courseId, title: courseResult.title });

        return {
          type: "course_details" as const,
          course: {
            ...courseResult,
            categories: categoriesData,
            instructorName,
            modulesCount: modulesWithItems.length,
            modules: modulesWithItems,
          },
        };
      },
    }),

    updateCourse: tool({
      description: "Update course metadata like title, description, price, level, etc. Does NOT affect modules - use updateCourseModules for that. IMPORTANT: Use courseId from REFERENCED COURSES section.",
      inputSchema: updateCourseSchema,
      execute: async ({ courseId, ...updates }) => {
        const isInContext = ctx.contextCourses?.some((c) => c.id === courseId);
        logger.info("updateCourse called", {
          courseId,
          isInContext,
          updates: Object.keys(updates),
        });

        const [existing] = await db
          .select({ id: coursesTable.id, title: coursesTable.title })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Course not found" };
        }

        const updateData: Record<string, unknown> = {};
        const updatedFields: string[] = [];

        if (updates.title !== undefined) { updateData.title = updates.title; updatedFields.push("title"); }
        if (updates.shortDescription !== undefined) { updateData.shortDescription = updates.shortDescription; updatedFields.push("shortDescription"); }
        if (updates.description !== undefined) { updateData.description = updates.description; updatedFields.push("description"); }
        if (updates.level !== undefined) { updateData.level = updates.level; updatedFields.push("level"); }
        if (updates.price !== undefined) { updateData.price = updates.price; updatedFields.push("price"); }
        if (updates.originalPrice !== undefined) { updateData.originalPrice = updates.originalPrice; updatedFields.push("originalPrice"); }
        if (updates.currency !== undefined) { updateData.currency = updates.currency; updatedFields.push("currency"); }
        if (updates.tags !== undefined) { updateData.tags = updates.tags; updatedFields.push("tags"); }
        if (updates.features !== undefined) { updateData.features = updates.features; updatedFields.push("features"); }
        if (updates.requirements !== undefined) { updateData.requirements = updates.requirements; updatedFields.push("requirements"); }
        if (updates.objectives !== undefined) { updateData.objectives = updates.objectives; updatedFields.push("objectives"); }
        if (updates.language !== undefined) { updateData.language = updates.language; updatedFields.push("language"); }
        if (updates.includeCertificate !== undefined) { updateData.includeCertificate = updates.includeCertificate; updatedFields.push("includeCertificate"); }
        if (updates.thumbnail !== undefined) { updateData.thumbnail = updates.thumbnail; updatedFields.push("thumbnail"); }
        if (updates.previewVideoUrl !== undefined) { updateData.previewVideoUrl = updates.previewVideoUrl; updatedFields.push("previewVideoUrl"); }

        if (updates.categoryIds !== undefined) {
          await db.delete(courseCategoriesTable).where(eq(courseCategoriesTable.courseId, courseId));

          if (updates.categoryIds.length > 0) {
            const validCategories = await db
              .select({ id: categoriesTable.id })
              .from(categoriesTable)
              .where(
                and(
                  eq(categoriesTable.tenantId, tenantId),
                  inArray(categoriesTable.id, updates.categoryIds)
                )
              );

            const validCategoryIds = validCategories.map((c) => c.id);

            if (validCategoryIds.length > 0) {
              await db.insert(courseCategoriesTable).values(
                validCategoryIds.map((categoryId) => ({
                  courseId,
                  categoryId,
                }))
              );
            }

            const invalidIds = updates.categoryIds.filter((id) => !validCategoryIds.includes(id));
            if (invalidIds.length > 0) {
              logger.warn("updateCourse: invalid categoryIds filtered", { invalidIds });
            }
          }

          updatedFields.push("categoryIds");
        }

        if (updates.instructorId !== undefined) {
          if (updates.instructorId === null) {
            updateData.instructorId = null;
            updatedFields.push("instructorId");
          } else {
            const [instructor] = await db
              .select({ id: instructorsTable.id })
              .from(instructorsTable)
              .where(and(eq(instructorsTable.tenantId, tenantId), eq(instructorsTable.id, updates.instructorId)))
              .limit(1);
            if (instructor) {
              updateData.instructorId = updates.instructorId;
              updatedFields.push("instructorId");
            } else {
              logger.warn("updateCourse: invalid instructorId", { instructorId: updates.instructorId });
            }
          }
        }

        if (updatedFields.length === 0) {
          return { type: "error" as const, error: "No valid fields to update" };
        }

        if (Object.keys(updateData).length > 0) {
          await db.update(coursesTable).set(updateData).where(eq(coursesTable.id, courseId));
        }

        logger.info("updateCourse executed", { courseId, updatedFields });

        return {
          type: "course_updated" as const,
          courseId,
          title: (updateData.title as string) ?? existing.title,
          updatedFields,
        };
      },
    }),

    updateCourseModules: tool({
      description: "Modify modules in a course. Use mode='add' to add modules (default), mode='remove' to remove modules, mode='replace' to replace all modules.",
      inputSchema: updateCourseModulesSchema,
      execute: async ({ courseId, modules, mode = "add" }) => {
        const [existing] = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Course not found" };
        }

        const moduleIds = modules.map((m) => m.moduleId);
        const validModules = moduleIds.length > 0
          ? await db
              .select({ id: modulesTable.id })
              .from(modulesTable)
              .where(and(eq(modulesTable.tenantId, tenantId), inArray(modulesTable.id, moduleIds)))
          : [];

        const validIds = new Set(validModules.map((m) => m.id));
        const invalidIds = moduleIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
          logger.warn("updateCourseModules: invalid module IDs", { courseId, invalidIds, mode });
          return { type: "error" as const, error: `Invalid module IDs: ${invalidIds.join(", ")}` };
        }

        if (mode === "remove") {
          if (modules.length === 0) {
            return { type: "error" as const, error: "No modules to remove" };
          }
          await db.delete(courseModulesTable).where(
            and(
              eq(courseModulesTable.courseId, courseId),
              inArray(courseModulesTable.moduleId, moduleIds)
            )
          );
          logger.info("updateCourseModules: modules removed", { courseId, removedCount: modules.length });
          return {
            type: "course_modules_removed" as const,
            courseId,
            removedCount: modules.length,
            removedModuleIds: moduleIds,
          };
        }

        if (mode === "add") {
          const existingModules = await db
            .select({ order: courseModulesTable.order })
            .from(courseModulesTable)
            .where(eq(courseModulesTable.courseId, courseId));

          const maxOrder = existingModules.length > 0
            ? Math.max(...existingModules.map((m) => m.order))
            : -1;

          if (modules.length > 0) {
            await db.insert(courseModulesTable).values(
              modules.map((m, idx) => ({
                courseId,
                moduleId: m.moduleId,
                order: m.order ?? maxOrder + idx + 1,
              }))
            );
          }

          logger.info("updateCourseModules: modules added", { courseId, addedCount: modules.length });
          return {
            type: "course_modules_added" as const,
            courseId,
            addedCount: modules.length,
            addedModuleIds: moduleIds,
            totalModules: existingModules.length + modules.length,
          };
        }

        await db.delete(courseModulesTable).where(eq(courseModulesTable.courseId, courseId));

        if (modules.length > 0) {
          await db.insert(courseModulesTable).values(
            modules.map((m, idx) => ({
              courseId,
              moduleId: m.moduleId,
              order: m.order ?? idx,
            }))
          );
        }

        logger.info("updateCourseModules: modules replaced", { courseId, modulesCount: modules.length });
        return {
          type: "course_modules_replaced" as const,
          courseId,
          modulesCount: modules.length,
          moduleIds,
        };
      },
    }),

    publishCourse: tool({
      description: "Publish a course to make it visible to students. Call with confirmed=false first to get confirmation details.",
      inputSchema: publishCourseSchema,
      execute: async ({ courseId, confirmed }) => {
        const [existing] = await db
          .select({ id: coursesTable.id, title: coursesTable.title, status: coursesTable.status })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Course not found" };
        }

        if (existing.status === "published") {
          return { type: "error" as const, error: "Course is already published" };
        }

        if (!confirmed) {
          return {
            type: "confirmation_required" as const,
            action: "publish_course",
            courseId,
            courseTitle: existing.title,
            message: `Are you sure you want to publish "${existing.title}"? It will become visible to students.`,
          };
        }

        await db.update(coursesTable).set({ status: "published" }).where(eq(coursesTable.id, courseId));

        logger.info("publishCourse executed", { courseId, title: existing.title });

        return {
          type: "course_published" as const,
          courseId,
          title: existing.title,
        };
      },
    }),

    unpublishCourse: tool({
      description: "Unpublish a course to hide it from students. This is destructive - students will lose access. Requires confirmation.",
      inputSchema: unpublishCourseSchema,
      execute: async ({ courseId, confirmed }) => {
        const [existing] = await db
          .select({ id: coursesTable.id, title: coursesTable.title, status: coursesTable.status })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Course not found" };
        }

        if (existing.status === "draft") {
          return { type: "error" as const, error: "Course is already unpublished (draft)" };
        }

        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollmentsTable)
          .where(eq(enrollmentsTable.courseId, courseId));

        if (!confirmed) {
          return {
            type: "confirmation_required" as const,
            action: "unpublish_course",
            courseId,
            courseTitle: existing.title,
            message: `Are you sure you want to unpublish "${existing.title}"?`,
            warning: enrollmentCount.count > 0
              ? `This course has ${enrollmentCount.count} enrolled students who will lose access.`
              : "Students will not be able to see this course.",
          };
        }

        await db.update(coursesTable).set({ status: "draft" }).where(eq(coursesTable.id, courseId));

        logger.info("unpublishCourse executed", { courseId, title: existing.title, enrollmentCount: enrollmentCount.count });

        return {
          type: "course_unpublished" as const,
          courseId,
          title: existing.title,
        };
      },
    }),

    deleteCourse: tool({
      description: "Permanently delete a course. This is IRREVERSIBLE. Requires confirmation.",
      inputSchema: deleteCourseSchema,
      execute: async ({ courseId, confirmed }) => {
        const [existing] = await db
          .select({ id: coursesTable.id, title: coursesTable.title })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Course not found" };
        }

        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollmentsTable)
          .where(eq(enrollmentsTable.courseId, courseId));

        if (!confirmed) {
          return {
            type: "confirmation_required" as const,
            action: "delete_course",
            courseId,
            courseTitle: existing.title,
            message: `Are you sure you want to PERMANENTLY delete "${existing.title}"?`,
            warning: enrollmentCount.count > 0
              ? `This course has ${enrollmentCount.count} enrolled students who will lose access. This action cannot be undone.`
              : "This action cannot be undone.",
          };
        }

        await db.delete(coursesTable).where(eq(coursesTable.id, courseId));

        logger.info("deleteCourse executed", { courseId, title: existing.title });

        return {
          type: "course_deleted" as const,
          courseId,
          title: existing.title,
        };
      },
    }),

    regenerateThumbnail: tool({
      description: "Regenerate course thumbnail using AI with optional style. Use when user wants a new AI-generated image for the course cover.",
      inputSchema: regenerateThumbnailSchema,
      execute: async ({ courseId, style }) => {
        const [course] = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            shortDescription: coursesTable.shortDescription,
          })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!course) {
          return { type: "error" as const, error: "Course not found" };
        }

        logger.info("regenerateThumbnail: starting", { courseId, style });

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

        const STYLE_DESCRIPTIONS: Record<string, string> = {
          default: "",
          minimal: "Use a minimalist aesthetic with clean lines, simple shapes, and plenty of negative space. Limited color palette.",
          professional: "Corporate and polished look with structured composition, subtle gradients, and business-appropriate imagery.",
          colorful: "Vibrant and saturated colors, playful gradients, energetic composition with multiple accent colors.",
          futuristic: "Sci-fi inspired with neon accents, holographic effects, dark backgrounds with glowing elements.",
          realistic: "Photorealistic 3D rendering with natural lighting, detailed textures, and lifelike materials.",
          abstract: "Non-representational shapes, artistic interpretation, bold geometric patterns and fluid forms.",
          vintage: "Retro aesthetic with muted colors, film grain texture, nostalgic 70s-80s visual style.",
          playful: "Fun and whimsical with rounded shapes, bright colors, cartoon-like elements and friendly vibe.",
          dark: "Dark mode aesthetic with deep backgrounds, subtle highlights, moody atmosphere.",
          light: "Bright and airy with white backgrounds, soft shadows, clean and fresh appearance.",
        };

        const styleDescription = style ? STYLE_DESCRIPTIONS[style] || "" : "";

        let imagePrompt = THUMBNAIL_GENERATION_PROMPT
          .replace("{{title}}", course.title)
          .replace("{{description}}", course.shortDescription || "")
          .replace("{{topics}}", topics.join(", "));

        if (styleDescription) {
          imagePrompt += `\n\nSTYLE REQUIREMENT: ${styleDescription}`;
        }

        try {
          const imageResult = await generateText({
            model: aiGateway(AI_MODELS.IMAGE_GENERATION),
            prompt: imagePrompt,
          });

          const imageFile = imageResult.files?.[0];
          if (!imageFile || !imageFile.mediaType.startsWith("image")) {
            logger.error("regenerateThumbnail: no image generated");
            return { type: "error" as const, error: "Failed to generate thumbnail image" };
          }

          const base64Data = `data:${imageFile.mediaType};base64,${imageFile.base64}`;
          const thumbnailKey = await uploadBase64ToS3({
            base64: base64Data,
            folder: `courses/${courseId}`,
            userId,
          });

          await db
            .update(coursesTable)
            .set({ thumbnail: thumbnailKey })
            .where(eq(coursesTable.id, courseId));

          logger.info("regenerateThumbnail: completed", { courseId, thumbnailKey, style });

          return {
            type: "thumbnail_regenerated" as const,
            courseId,
            courseTitle: course.title,
            thumbnailUrl: getPresignedUrl(thumbnailKey),
            style: style || "default",
          };
        } catch (error) {
          logger.error("regenerateThumbnail: failed", {
            courseId,
            error: error instanceof Error ? error.message : String(error),
          });
          return {
            type: "error" as const,
            error: "Failed to generate thumbnail. Please try again.",
          };
        }
      },
    }),
  };
}
