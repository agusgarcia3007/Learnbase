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
} from "@/db/schema";
import { eq, and, ilike, or, desc, sql, isNotNull, gt, inArray } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  searchVideosSchema,
  searchDocumentsSchema,
  searchQuizzesSchema,
  searchModulesSchema,
  createQuizSchema,
  createModuleSchema,
  generateCoursePreviewSchema,
  createCourseSchema,
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

  return {
    searchVideos: tool({
      description: "Search for existing videos by semantic similarity",
      inputSchema: searchVideosSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `videos:${query}:${limit ?? 10}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("searchVideos cache hit", { query });
          return cached;
        }

        const queryEmbedding = await getCachedEmbedding(query);
        const similarity = sql<number>`1 - (${cosineDistance(videosTable.embedding, queryEmbedding)})`;

        let videos = await db
          .select({
            id: videosTable.id,
            title: videosTable.title,
            description: videosTable.description,
            duration: videosTable.duration,
            similarity,
          })
          .from(videosTable)
          .where(
            and(
              eq(videosTable.tenantId, tenantId),
              eq(videosTable.status, "published"),
              isNotNull(videosTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.SEARCH)
            )
          )
          .orderBy(desc(similarity))
          .limit(limit ?? 10);

        if (videos.length === 0) {
          videos = await db
            .select({
              id: videosTable.id,
              title: videosTable.title,
              description: videosTable.description,
              duration: videosTable.duration,
              similarity: sql<number>`0`.as("similarity"),
            })
            .from(videosTable)
            .where(
              and(
                eq(videosTable.tenantId, tenantId),
                eq(videosTable.status, "published"),
                or(
                  ilike(videosTable.title, `%${query}%`),
                  ilike(videosTable.description, `%${query}%`)
                )
              )
            )
            .orderBy(desc(videosTable.createdAt))
            .limit(limit ?? 10);
        }

        const result = { videos, count: videos.length };
        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("searchVideos executed", { query, found: videos.length });
        return result;
      },
    }),

    searchDocuments: tool({
      description: "Search for existing documents by semantic similarity",
      inputSchema: searchDocumentsSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `documents:${query}:${limit ?? 10}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("searchDocuments cache hit", { query });
          return cached;
        }

        const queryEmbedding = await getCachedEmbedding(query);
        const similarity = sql<number>`1 - (${cosineDistance(documentsTable.embedding, queryEmbedding)})`;

        let documents = await db
          .select({
            id: documentsTable.id,
            title: documentsTable.title,
            description: documentsTable.description,
            fileName: documentsTable.fileName,
            mimeType: documentsTable.mimeType,
            similarity,
          })
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.tenantId, tenantId),
              eq(documentsTable.status, "published"),
              isNotNull(documentsTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.SEARCH)
            )
          )
          .orderBy(desc(similarity))
          .limit(limit ?? 10);

        if (documents.length === 0) {
          documents = await db
            .select({
              id: documentsTable.id,
              title: documentsTable.title,
              description: documentsTable.description,
              fileName: documentsTable.fileName,
              mimeType: documentsTable.mimeType,
              similarity: sql<number>`0`.as("similarity"),
            })
            .from(documentsTable)
            .where(
              and(
                eq(documentsTable.tenantId, tenantId),
                eq(documentsTable.status, "published"),
                or(
                  ilike(documentsTable.title, `%${query}%`),
                  ilike(documentsTable.description, `%${query}%`)
                )
              )
            )
            .orderBy(desc(documentsTable.createdAt))
            .limit(limit ?? 10);
        }

        const result = { documents, count: documents.length };
        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("searchDocuments executed", { query, found: documents.length });
        return result;
      },
    }),

    searchQuizzes: tool({
      description: "Search for existing quizzes by semantic similarity",
      inputSchema: searchQuizzesSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `quizzes:${query}:${limit ?? 10}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("searchQuizzes cache hit", { query });
          return cached;
        }

        const queryEmbedding = await getCachedEmbedding(query);
        const similarity = sql<number>`1 - (${cosineDistance(quizzesTable.embedding, queryEmbedding)})`;

        let quizzes = await db
          .select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            description: quizzesTable.description,
            similarity,
          })
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.tenantId, tenantId),
              eq(quizzesTable.status, "published"),
              isNotNull(quizzesTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.SEARCH)
            )
          )
          .orderBy(desc(similarity))
          .limit(limit ?? 10);

        if (quizzes.length === 0) {
          quizzes = await db
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
                or(
                  ilike(quizzesTable.title, `%${query}%`),
                  ilike(quizzesTable.description, `%${query}%`)
                )
              )
            )
            .orderBy(desc(quizzesTable.createdAt))
            .limit(limit ?? 10);
        }

        const result = { quizzes, count: quizzes.length };
        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("searchQuizzes executed", { query, found: quizzes.length });
        return result;
      },
    }),

    searchModules: tool({
      description: "Search for existing modules by semantic similarity. Use these modules directly in courses instead of creating new ones.",
      inputSchema: searchModulesSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `modules:${query}:${limit ?? 10}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          logger.info("searchModules cache hit", { query });
          return cached;
        }

        const queryEmbedding = await getCachedEmbedding(query);
        const similarity = sql<number>`1 - (${cosineDistance(modulesTable.embedding, queryEmbedding)})`;

        let modules = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            description: modulesTable.description,
            similarity,
          })
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.tenantId, tenantId),
              eq(modulesTable.status, "published"),
              isNotNull(modulesTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.SEARCH)
            )
          )
          .orderBy(desc(similarity))
          .limit(limit ?? 10);

        if (modules.length === 0) {
          modules = await db
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
                or(
                  ilike(modulesTable.title, `%${query}%`),
                  ilike(modulesTable.description, `%${query}%`)
                )
              )
            )
            .orderBy(desc(modulesTable.createdAt))
            .limit(limit ?? 10);
        }

        const result = { modules, count: modules.length };
        setCacheWithLimit(searchCache, cacheKey, result);
        logger.info("searchModules executed", { query, found: modules.length });
        return result;
      },
    }),

    listCategories: tool({
      description: "List available categories to assign to the course. Call this to show the user category options.",
      inputSchema: z.object({}),
      execute: async () => {
        const cacheKey = "categories";
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
          .where(eq(categoriesTable.tenantId, tenantId));

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
  };
}

export type CourseCreatorTools = ReturnType<typeof createCourseCreatorTools>;
