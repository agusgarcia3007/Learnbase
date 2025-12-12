import { tool } from "ai";
import { z } from "zod";
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
  categoriesTable,
  instructorsTable,
  enrollmentsTable,
} from "@/db/schema";
import { eq, and, ilike, or, desc, sql, isNotNull, gt, inArray, count } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  searchContentSchema,
  listCategoriesSchema,
  createQuizSchema,
  createModuleSchema,
  generateCoursePreviewSchema,
  createCourseSchema,
  getCourseSchema,
  updateCourseSchema,
  updateCourseModulesSchema,
  updateModuleItemsSchema,
  publishCourseSchema,
  unpublishCourseSchema,
  deleteCourseSchema,
  listInstructorsSchema,
} from "./schemas";
import { generateEmbedding } from "../embeddings";

export * from "./schemas";

const SIMILARITY_THRESHOLDS = {
  SEARCH: 0.4,
  DEDUP_CREATE: 0.75,
};

const MAX_CACHE_SIZE = 100;

function setCacheWithLimit(cache: Map<string, unknown>, key: string, value: unknown) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

export function createCourseCreatorTools(tenantId: string, cache?: Map<string, unknown>) {
  const searchCache = cache ?? new Map<string, unknown>();
  const embeddingCache = new Map<string, number[]>();

  async function getCachedEmbedding(query: string): Promise<number[]> {
    const key = query.toLowerCase().trim();
    const cached = embeddingCache.get(key);
    if (cached) {
      logger.info("Embedding cache hit", { query: key });
      return cached;
    }
    const embedding = await generateEmbedding(query);
    setCacheWithLimit(embeddingCache, key, embedding);
    return embedding;
  }

  const compactResult = <T extends { id: string; title: string; similarity: number; description?: string | null }>(
    item: T
  ): { id: string; title: string; similarity: number; description?: string } => {
    const base = { id: item.id, title: item.title, similarity: item.similarity };
    if (item.similarity > 0.8 && item.description) {
      return { ...base, description: item.description.slice(0, 100) };
    }
    return base;
  };

  return {
    searchContent: tool({
      description: "Search all content types (videos, documents, quizzes, modules) in a single call. Always call this first to find available content.",
      inputSchema: searchContentSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `content:${query}:${limit ?? 5}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("searchContent cache hit", { query });
          return cached;
        }

        const queryEmbedding = await getCachedEmbedding(query);
        const videoSimilarity = sql<number>`1 - (${cosineDistance(videosTable.embedding, queryEmbedding)})`;
        const documentSimilarity = sql<number>`1 - (${cosineDistance(documentsTable.embedding, queryEmbedding)})`;
        const quizSimilarity = sql<number>`1 - (${cosineDistance(quizzesTable.embedding, queryEmbedding)})`;
        const moduleSimilarity = sql<number>`1 - (${cosineDistance(modulesTable.embedding, queryEmbedding)})`;

        const [videosResult, documentsResult, quizzesResult, modulesResult] = await Promise.all([
          db
            .select({
              id: videosTable.id,
              title: videosTable.title,
              description: videosTable.description,
              similarity: videoSimilarity,
            })
            .from(videosTable)
            .where(
              and(
                eq(videosTable.tenantId, tenantId),
                eq(videosTable.status, "published"),
                isNotNull(videosTable.embedding),
                gt(videoSimilarity, SIMILARITY_THRESHOLDS.SEARCH)
              )
            )
            .orderBy(desc(videoSimilarity))
            .limit(limit ?? 5),

          db
            .select({
              id: documentsTable.id,
              title: documentsTable.title,
              description: documentsTable.description,
              similarity: documentSimilarity,
            })
            .from(documentsTable)
            .where(
              and(
                eq(documentsTable.tenantId, tenantId),
                eq(documentsTable.status, "published"),
                isNotNull(documentsTable.embedding),
                gt(documentSimilarity, SIMILARITY_THRESHOLDS.SEARCH)
              )
            )
            .orderBy(desc(documentSimilarity))
            .limit(limit ?? 5),

          db
            .select({
              id: quizzesTable.id,
              title: quizzesTable.title,
              description: quizzesTable.description,
              similarity: quizSimilarity,
            })
            .from(quizzesTable)
            .where(
              and(
                eq(quizzesTable.tenantId, tenantId),
                eq(quizzesTable.status, "published"),
                isNotNull(quizzesTable.embedding),
                gt(quizSimilarity, SIMILARITY_THRESHOLDS.SEARCH)
              )
            )
            .orderBy(desc(quizSimilarity))
            .limit(limit ?? 5),

          db
            .select({
              id: modulesTable.id,
              title: modulesTable.title,
              description: modulesTable.description,
              similarity: moduleSimilarity,
            })
            .from(modulesTable)
            .where(
              and(
                eq(modulesTable.tenantId, tenantId),
                eq(modulesTable.status, "published"),
                isNotNull(modulesTable.embedding),
                gt(moduleSimilarity, SIMILARITY_THRESHOLDS.SEARCH)
              )
            )
            .orderBy(desc(moduleSimilarity))
            .limit(limit ?? 5),
        ]);

        let videos = videosResult;
        let documents = documentsResult;
        let quizzes = quizzesResult;
        let modules = modulesResult;

        if (videos.length === 0 && documents.length === 0 && quizzes.length === 0 && modules.length === 0) {
          const [fallbackVideos, fallbackDocuments, fallbackQuizzes, fallbackModules] = await Promise.all([
            db
              .select({
                id: videosTable.id,
                title: videosTable.title,
                description: videosTable.description,
                similarity: sql<number>`0`.as("similarity"),
              })
              .from(videosTable)
              .where(
                and(
                  eq(videosTable.tenantId, tenantId),
                  eq(videosTable.status, "published"),
                  or(ilike(videosTable.title, `%${query}%`), ilike(videosTable.description, `%${query}%`))
                )
              )
              .orderBy(desc(videosTable.createdAt))
              .limit(limit ?? 5),

            db
              .select({
                id: documentsTable.id,
                title: documentsTable.title,
                description: documentsTable.description,
                similarity: sql<number>`0`.as("similarity"),
              })
              .from(documentsTable)
              .where(
                and(
                  eq(documentsTable.tenantId, tenantId),
                  eq(documentsTable.status, "published"),
                  or(ilike(documentsTable.title, `%${query}%`), ilike(documentsTable.description, `%${query}%`))
                )
              )
              .orderBy(desc(documentsTable.createdAt))
              .limit(limit ?? 5),

            db
              .select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                description: quizzesTable.description,
                similarity: sql<number>`0`.as("similarity"),
              })
              .from(quizzesTable)
              .where(
                and(
                  eq(quizzesTable.tenantId, tenantId),
                  eq(quizzesTable.status, "published"),
                  or(ilike(quizzesTable.title, `%${query}%`), ilike(quizzesTable.description, `%${query}%`))
                )
              )
              .orderBy(desc(quizzesTable.createdAt))
              .limit(limit ?? 5),

            db
              .select({
                id: modulesTable.id,
                title: modulesTable.title,
                description: modulesTable.description,
                similarity: sql<number>`0`.as("similarity"),
              })
              .from(modulesTable)
              .where(
                and(
                  eq(modulesTable.tenantId, tenantId),
                  eq(modulesTable.status, "published"),
                  or(ilike(modulesTable.title, `%${query}%`), ilike(modulesTable.description, `%${query}%`))
                )
              )
              .orderBy(desc(modulesTable.createdAt))
              .limit(limit ?? 5),
          ]);

          videos = fallbackVideos;
          documents = fallbackDocuments;
          quizzes = fallbackQuizzes;
          modules = fallbackModules;
        }

        const result = {
          videos: videos.map(compactResult),
          documents: documents.map(compactResult),
          quizzes: quizzes.map(compactResult),
          modules: modules.map(compactResult),
          totalCount: videos.length + documents.length + quizzes.length + modules.length,
        };

        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("searchContent executed", {
          query,
          videos: videos.length,
          documents: documents.length,
          quizzes: quizzes.length,
          modules: modules.length,
        });
        return result;
      },
    }),

    listCategories: tool({
      description: "List available categories to assign to the course.",
      inputSchema: listCategoriesSchema,
      execute: async ({ limit }) => {
        const cacheKey = `categories:${limit ?? 20}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("listCategories cache hit");
          return cached;
        }

        const categories = await db
          .select({
            id: categoriesTable.id,
            name: categoriesTable.name,
            slug: categoriesTable.slug,
          })
          .from(categoriesTable)
          .where(eq(categoriesTable.tenantId, tenantId))
          .limit(limit ?? 20);

        const result = { categories, count: categories.length };
        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("listCategories executed", { found: categories.length });
        return result;
      },
    }),

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

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const [question] = await db
            .insert(quizQuestionsTable)
            .values({
              quizId: quiz.id,
              tenantId,
              type: q.type === "true_false" ? "true_false" : "multiple_choice",
              questionText: q.questionText,
              explanation: q.explanation ?? null,
              order: i,
            })
            .returning();

          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await db.insert(quizOptionsTable).values({
              questionId: question.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              order: j,
            });
          }
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

    createModule: tool({
      description: "Create a new module with content items. Module is created as published. Returns existing module if similar one already exists.",
      inputSchema: createModuleSchema,
      execute: async ({ title, description, items }) => {
        const videoIds = items.filter((i) => i.type === "video").map((i) => i.id);
        const documentIds = items.filter((i) => i.type === "document").map((i) => i.id);
        const quizIds = items.filter((i) => i.type === "quiz").map((i) => i.id);

        const [validVideos, validDocuments, validQuizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id }).from(videosTable)
                .where(and(eq(videosTable.tenantId, tenantId), inArray(videosTable.id, videoIds)))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id }).from(documentsTable)
                .where(and(eq(documentsTable.tenantId, tenantId), inArray(documentsTable.id, documentIds)))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id }).from(quizzesTable)
                .where(and(eq(quizzesTable.tenantId, tenantId), inArray(quizzesTable.id, quizIds)))
            : [],
        ]);

        const validVideoIds = new Set(validVideos.map((v) => v.id));
        const validDocumentIds = new Set(validDocuments.map((d) => d.id));
        const validQuizIds = new Set(validQuizzes.map((q) => q.id));

        const validItems = items.filter((item) => {
          if (item.type === "video") return validVideoIds.has(item.id);
          if (item.type === "document") return validDocumentIds.has(item.id);
          if (item.type === "quiz") return validQuizIds.has(item.id);
          return false;
        });

        const invalidCount = items.length - validItems.length;
        if (invalidCount > 0) {
          logger.warn("createModule: filtered invalid item IDs", {
            title,
            totalItems: items.length,
            validItems: validItems.length,
            invalidCount,
          });
        }

        if (validItems.length === 0) {
          logger.error("createModule: no valid items provided", { title, items });
          return {
            type: "error" as const,
            error: "No valid content IDs provided. Use ACTUAL UUIDs from searchVideos/searchDocuments/searchQuizzes results.",
          };
        }

        const text = `${title} ${description || ""}`.trim();
        const queryEmbedding = await generateEmbedding(text);
        const similarity = sql<number>`1 - (${cosineDistance(modulesTable.embedding, queryEmbedding)})`;

        const existingModules = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            similarity,
          })
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.tenantId, tenantId),
              eq(modulesTable.status, "published"),
              isNotNull(modulesTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.DEDUP_CREATE)
            )
          )
          .orderBy(desc(similarity))
          .limit(1);

        if (existingModules.length > 0) {
          const existing = existingModules[0];
          logger.info("createModule: found existing similar module", {
            existingId: existing.id,
            existingTitle: existing.title,
            requestedTitle: title,
            similarity: existing.similarity,
          });

          const existingItems = await db
            .select({ id: moduleItemsTable.id })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, existing.id))
            .limit(1);

          if (existingItems.length === 0 && validItems.length > 0) {
            logger.info("createModule: existing module has no items, adding items", {
              moduleId: existing.id,
              itemCount: validItems.length,
            });

            for (const item of validItems) {
              await db.insert(moduleItemsTable).values({
                moduleId: existing.id,
                contentType: item.type,
                contentId: item.id,
                order: item.order,
                isPreview: item.isPreview ?? false,
              });
            }

            return {
              id: existing.id,
              title: existing.title,
              itemsCount: validItems.length,
              alreadyExisted: true,
              itemsAdded: true,
            };
          }

          return {
            id: existing.id,
            title: existing.title,
            itemsCount: existingItems.length,
            alreadyExisted: true,
          };
        }

        const [module] = await db
          .insert(modulesTable)
          .values({
            tenantId,
            title,
            description: description ?? null,
            status: "published",
          })
          .returning();

        await db
          .update(modulesTable)
          .set({ embedding: queryEmbedding })
          .where(eq(modulesTable.id, module.id));

        for (const item of validItems) {
          await db.insert(moduleItemsTable).values({
            moduleId: module.id,
            contentType: item.type,
            contentId: item.id,
            order: item.order,
            isPreview: item.isPreview ?? false,
          });
        }

        logger.info("createModule executed", {
          moduleId: module.id,
          itemCount: validItems.length,
        });

        return {
          id: module.id,
          title: module.title,
          itemsCount: validItems.length,
        };
      },
    }),

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
        categoryId,
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
            logger.warn("createCourse: invalid categoryId, ignoring", { categoryId });
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
            categoryId: validCategoryId,
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

        logger.info("createCourse executed", {
          courseId: course.id,
          title: course.title,
          moduleCount: validModuleIds.length,
        });

          return {
            type: "course_created" as const,
            courseId: course.id,
            title: course.title,
            slug: course.slug,
            modulesCount: validModuleIds.length,
            moduleIds: validModuleIds,
            hasCustomThumbnail: !!customThumbnailKey,
          };
        } catch (error) {
          logger.error("createCourse failed", {
            error: error instanceof Error ? error.message : String(error),
            title,
            moduleIds,
            categoryId,
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
      description: "Get full course details including modules and items. Use this to understand the current state of a course before making edits.",
      inputSchema: getCourseSchema,
      execute: async ({ courseId }) => {
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
            categoryId: coursesTable.categoryId,
            instructorId: coursesTable.instructorId,
          })
          .from(coursesTable)
          .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)))
          .limit(1);

        if (!courseResult) {
          return { type: "error" as const, error: "Course not found" };
        }

        let categoryName: string | null = null;
        if (courseResult.categoryId) {
          const [cat] = await db
            .select({ name: categoriesTable.name })
            .from(categoriesTable)
            .where(eq(categoriesTable.id, courseResult.categoryId))
            .limit(1);
          categoryName = cat?.name ?? null;
        }

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
            categoryName,
            instructorName,
            modulesCount: modulesWithItems.length,
            modules: modulesWithItems,
          },
        };
      },
    }),

    updateCourse: tool({
      description: "Update course metadata like title, description, price, level, etc. Does NOT affect modules - use updateCourseModules for that.",
      inputSchema: updateCourseSchema,
      execute: async ({ courseId, ...updates }) => {
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

        if (updates.categoryId !== undefined) {
          if (updates.categoryId === null) {
            updateData.categoryId = null;
            updatedFields.push("categoryId");
          } else {
            const [category] = await db
              .select({ id: categoriesTable.id })
              .from(categoriesTable)
              .where(and(eq(categoriesTable.tenantId, tenantId), eq(categoriesTable.id, updates.categoryId)))
              .limit(1);
            if (category) {
              updateData.categoryId = updates.categoryId;
              updatedFields.push("categoryId");
            } else {
              logger.warn("updateCourse: invalid categoryId", { categoryId: updates.categoryId });
            }
          }
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

        await db.update(coursesTable).set(updateData).where(eq(coursesTable.id, courseId));

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

    updateModuleItems: tool({
      description: "Set the items in a module. This REPLACES all existing items. Use to add, remove, or reorder content within a module.",
      inputSchema: updateModuleItemsSchema,
      execute: async ({ moduleId, items }) => {
        const [existingModule] = await db
          .select({ id: modulesTable.id, title: modulesTable.title })
          .from(modulesTable)
          .where(and(eq(modulesTable.id, moduleId), eq(modulesTable.tenantId, tenantId)))
          .limit(1);

        if (!existingModule) {
          return { type: "error" as const, error: "Module not found" };
        }

        const videoIds = items.filter((i) => i.contentType === "video").map((i) => i.contentId);
        const documentIds = items.filter((i) => i.contentType === "document").map((i) => i.contentId);
        const quizIds = items.filter((i) => i.contentType === "quiz").map((i) => i.contentId);

        const [validVideos, validDocuments, validQuizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id }).from(videosTable).where(and(eq(videosTable.tenantId, tenantId), inArray(videosTable.id, videoIds)))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id }).from(documentsTable).where(and(eq(documentsTable.tenantId, tenantId), inArray(documentsTable.id, documentIds)))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id }).from(quizzesTable).where(and(eq(quizzesTable.tenantId, tenantId), inArray(quizzesTable.id, quizIds)))
            : [],
        ]);

        const validVideoIds = new Set(validVideos.map((v) => v.id));
        const validDocumentIds = new Set(validDocuments.map((d) => d.id));
        const validQuizIds = new Set(validQuizzes.map((q) => q.id));

        const validItems = items.filter((item) => {
          if (item.contentType === "video") return validVideoIds.has(item.contentId);
          if (item.contentType === "document") return validDocumentIds.has(item.contentId);
          if (item.contentType === "quiz") return validQuizIds.has(item.contentId);
          return false;
        });

        if (validItems.length !== items.length) {
          const invalidCount = items.length - validItems.length;
          logger.warn("updateModuleItems: filtered invalid items", { moduleId, invalidCount });
        }

        await db.delete(moduleItemsTable).where(eq(moduleItemsTable.moduleId, moduleId));

        if (validItems.length > 0) {
          await db.insert(moduleItemsTable).values(
            validItems.map((item) => ({
              moduleId,
              contentType: item.contentType,
              contentId: item.contentId,
              order: item.order,
              isPreview: item.isPreview ?? false,
            }))
          );
        }

        logger.info("updateModuleItems executed", { moduleId, itemsCount: validItems.length });

        return {
          type: "module_items_updated" as const,
          moduleId,
          moduleTitle: existingModule.title,
          itemsCount: validItems.length,
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

    listInstructors: tool({
      description: "List available instructors to assign to courses.",
      inputSchema: listInstructorsSchema,
      execute: async ({ limit }) => {
        const instructors = await db
          .select({
            id: instructorsTable.id,
            name: instructorsTable.name,
            title: instructorsTable.title,
          })
          .from(instructorsTable)
          .where(eq(instructorsTable.tenantId, tenantId))
          .limit(limit ?? 20);

        logger.info("listInstructors executed", { count: instructors.length });

        return { instructors, count: instructors.length };
      },
    }),
  };
}

export type CourseCreatorTools = ReturnType<typeof createCourseCreatorTools>;
