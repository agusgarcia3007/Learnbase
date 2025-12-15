import { tool } from "ai";
import { db } from "@/db";
import { videosTable, documentsTable, quizzesTable, modulesTable } from "@/db/schema";
import { eq, and, ilike, desc, sql, isNotNull, gt, or } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  searchContentSchema,
  listVideosSchema,
  listDocumentsSchema,
  listQuizzesSchema,
  listModulesSchema,
} from "./schemas";
import { setCacheWithLimit, compactResult, SIMILARITY_THRESHOLDS, type ToolContext } from "./utils";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  data: unknown;
  timestamp: number;
};

export function createContentListTools(ctx: ToolContext) {
  const { tenantId, searchCache, getCachedEmbedding } = ctx;

  return {
    searchContent: tool({
      description: "Search all content types (videos, documents, quizzes, modules) in a single call. Always call this first to find available content.",
      inputSchema: searchContentSchema,
      execute: async ({ query, limit }) => {
        const cacheKey = `content:${query}:${limit ?? 5}`;
        const cached = searchCache.get(cacheKey) as CacheEntry | undefined;
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          logger.info("searchContent cache hit", { query });
          return cached.data;
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

        const totalCount = videos.length + documents.length + quizzes.length + modules.length;

        if (totalCount === 0) {
          const noContentResult = {
            type: "no_content" as const,
            query,
            totalCount: 0,
            videos: [],
            documents: [],
            quizzes: [],
            modules: [],
            message: `No se encontro contenido sobre "${query}". El usuario debe subir videos o documentos primero desde el panel de Contenido.`,
            suggestion: "Pregunta al usuario si tiene contenido sobre el tema o si quiere subirlo.",
          };
          setCacheWithLimit(searchCache, cacheKey, { data: noContentResult, timestamp: Date.now() });
          logger.info("searchContent: no results", { query });
          return noContentResult;
        }

        const result = {
          videos: videos.map(compactResult),
          documents: documents.map(compactResult),
          quizzes: quizzes.map(compactResult),
          modules: modules.map(compactResult),
          totalCount,
        };

        setCacheWithLimit(searchCache, cacheKey, { data: result, timestamp: Date.now() });
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

    listVideos: tool({
      description: "List all videos with optional filtering by title or status.",
      inputSchema: listVideosSchema,
      execute: async ({ limit, search, status }) => {
        const conditions = [eq(videosTable.tenantId, tenantId)];
        if (search) conditions.push(ilike(videosTable.title, `%${search}%`));
        if (status) conditions.push(eq(videosTable.status, status));

        const videos = await db
          .select({
            id: videosTable.id,
            title: videosTable.title,
            description: videosTable.description,
            status: videosTable.status,
            duration: videosTable.duration,
          })
          .from(videosTable)
          .where(and(...conditions))
          .orderBy(desc(videosTable.createdAt))
          .limit(limit ?? 20);

        logger.info("listVideos executed", { count: videos.length });
        return { videos, count: videos.length };
      },
    }),

    listDocuments: tool({
      description: "List all documents with optional filtering by title or status.",
      inputSchema: listDocumentsSchema,
      execute: async ({ limit, search, status }) => {
        const conditions = [eq(documentsTable.tenantId, tenantId)];
        if (search) conditions.push(ilike(documentsTable.title, `%${search}%`));
        if (status) conditions.push(eq(documentsTable.status, status));

        const documents = await db
          .select({
            id: documentsTable.id,
            title: documentsTable.title,
            description: documentsTable.description,
            status: documentsTable.status,
          })
          .from(documentsTable)
          .where(and(...conditions))
          .orderBy(desc(documentsTable.createdAt))
          .limit(limit ?? 20);

        logger.info("listDocuments executed", { count: documents.length });
        return { documents, count: documents.length };
      },
    }),

    listQuizzes: tool({
      description: "List all quizzes with optional filtering by title or status.",
      inputSchema: listQuizzesSchema,
      execute: async ({ limit, search, status }) => {
        const conditions = [eq(quizzesTable.tenantId, tenantId)];
        if (search) conditions.push(ilike(quizzesTable.title, `%${search}%`));
        if (status) conditions.push(eq(quizzesTable.status, status));

        const quizzes = await db
          .select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            description: quizzesTable.description,
            status: quizzesTable.status,
          })
          .from(quizzesTable)
          .where(and(...conditions))
          .orderBy(desc(quizzesTable.createdAt))
          .limit(limit ?? 20);

        logger.info("listQuizzes executed", { count: quizzes.length });
        return { quizzes, count: quizzes.length };
      },
    }),

    listModules: tool({
      description: "List all modules with optional filtering by title or status.",
      inputSchema: listModulesSchema,
      execute: async ({ limit, search, status }) => {
        const conditions = [eq(modulesTable.tenantId, tenantId)];
        if (search) conditions.push(ilike(modulesTable.title, `%${search}%`));
        if (status) conditions.push(eq(modulesTable.status, status));

        const modules = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            description: modulesTable.description,
            status: modulesTable.status,
          })
          .from(modulesTable)
          .where(and(...conditions))
          .orderBy(desc(modulesTable.createdAt))
          .limit(limit ?? 20);

        logger.info("listModules executed", { count: modules.length });
        return { modules, count: modules.length };
      },
    }),
  };
}
