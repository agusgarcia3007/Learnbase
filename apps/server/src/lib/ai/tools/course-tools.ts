import { tool } from "ai";
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
import {
  generateCoursePreviewSchema,
  createCourseSchema,
  getCourseSchema,
  updateCourseSchema,
  updateCourseModulesSchema,
  publishCourseSchema,
  unpublishCourseSchema,
  deleteCourseSchema,
} from "./schemas";
import { type ToolContext } from "./utils";

export function createCourseTools(ctx: ToolContext) {
  const { tenantId } = ctx;

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
        customThumbnailKey,
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
              currency: "USD",
              language: "es",
              thumbnail: customThumbnailKey ?? null,
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
        if (updates.tags !== undefined) { updateData.tags = updates.tags; updatedFields.push("tags"); }
        if (updates.features !== undefined) { updateData.features = updates.features; updatedFields.push("features"); }
        if (updates.requirements !== undefined) { updateData.requirements = updates.requirements; updatedFields.push("requirements"); }
        if (updates.objectives !== undefined) { updateData.objectives = updates.objectives; updatedFields.push("objectives"); }
        if (updates.language !== undefined) { updateData.language = updates.language; updatedFields.push("language"); }
        if (updates.includeCertificate !== undefined) { updateData.includeCertificate = updates.includeCertificate; updatedFields.push("includeCertificate"); }

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
      description: "Set the modules in a course. This REPLACES all existing modules with the provided list. Use to add, remove, or reorder modules.",
      inputSchema: updateCourseModulesSchema,
      execute: async ({ courseId, modules }) => {
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
          return { type: "error" as const, error: `Invalid module IDs: ${invalidIds.join(", ")}` };
        }

        await db.delete(courseModulesTable).where(eq(courseModulesTable.courseId, courseId));

        if (modules.length > 0) {
          await db.insert(courseModulesTable).values(
            modules.map((m) => ({
              courseId,
              moduleId: m.moduleId,
              order: m.order,
            }))
          );
        }

        logger.info("updateCourseModules executed", { courseId, modulesCount: modules.length });

        return {
          type: "course_modules_updated" as const,
          courseId,
          modulesCount: modules.length,
          moduleIds: modules.map((m) => m.moduleId),
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
  };
}
