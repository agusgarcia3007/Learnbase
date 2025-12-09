import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  modulesTable,
  moduleItemsTable,
  videosTable,
  documentsTable,
  quizzesTable,
  moduleStatusEnum,
  contentTypeEnum,
  type SelectModule,
  type SelectVideo,
  type SelectDocument,
  type SelectQuiz,
  type ContentType,
} from "@/db/schema";
import { count, eq, and, desc, inArray, sql } from "drizzle-orm";
import {
  parseListParams,
  buildWhereClause,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type SearchableFields,
  type DateFields,
} from "@/lib/filters";
import { getPresignedUrl } from "@/lib/upload";
import { generateEmbedding } from "@/lib/ai/embeddings";

async function updateModuleEmbedding(moduleId: string, title: string, description: string | null) {
  const text = `${title} ${description || ""}`.trim();
  const embedding = await generateEmbedding(text);
  await db.update(modulesTable).set({ embedding }).where(eq(modulesTable.id, moduleId));
}

const moduleFieldMap: FieldMap<typeof modulesTable> = {
  id: modulesTable.id,
  title: modulesTable.title,
  status: modulesTable.status,
  order: modulesTable.order,
  createdAt: modulesTable.createdAt,
  updatedAt: modulesTable.updatedAt,
};

const moduleSearchableFields: SearchableFields<typeof modulesTable> = [
  modulesTable.title,
];

const moduleDateFields: DateFields = new Set(["createdAt"]);

type VideoWithUrl = SelectVideo & { videoUrl: string | null };
type DocumentWithUrl = SelectDocument & { fileUrl: string | null };

type ModuleItem = {
  id: string;
  contentType: ContentType;
  contentId: string;
  order: number;
  isPreview: boolean;
  content: VideoWithUrl | DocumentWithUrl | SelectQuiz;
};

type ModuleWithItems = SelectModule & {
  items: ModuleItem[];
  itemsCount: number;
};

function withVideoUrl(video: SelectVideo): VideoWithUrl {
  return {
    ...video,
    videoUrl: video.videoKey ? getPresignedUrl(video.videoKey) : null,
  };
}

function withFileUrl(document: SelectDocument): DocumentWithUrl {
  return {
    ...document,
    fileUrl: document.fileKey ? getPresignedUrl(document.fileKey) : null,
  };
}

export const modulesRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage modules",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          moduleFieldMap,
          moduleSearchableFields,
          moduleDateFields
        );

        const tenantFilter = eq(modulesTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, moduleFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const modulesWithCountQuery = db
          .select({
            id: modulesTable.id,
            tenantId: modulesTable.tenantId,
            title: modulesTable.title,
            description: modulesTable.description,
            status: modulesTable.status,
            order: modulesTable.order,
            createdAt: modulesTable.createdAt,
            updatedAt: modulesTable.updatedAt,
            itemsCount: sql<number>`cast(count(${moduleItemsTable.id}) as int)`,
          })
          .from(modulesTable)
          .leftJoin(moduleItemsTable, eq(modulesTable.id, moduleItemsTable.moduleId))
          .where(whereClause)
          .groupBy(modulesTable.id)
          .orderBy(sortColumn ?? desc(modulesTable.createdAt))
          .limit(limit)
          .offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(modulesTable)
          .where(whereClause);

        const [modulesWithCounts, [{ count: total }]] = await Promise.all([
          modulesWithCountQuery,
          countQuery,
        ]);

        return {
          modules: modulesWithCounts,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Modules"],
        summary: "List modules with pagination and filters",
      },
    }
  )
  .get(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const rows = await db
          .select({
            module: modulesTable,
            item: moduleItemsTable,
          })
          .from(modulesTable)
          .leftJoin(moduleItemsTable, eq(modulesTable.id, moduleItemsTable.moduleId))
          .where(
            and(
              eq(modulesTable.id, ctx.params.id),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .orderBy(moduleItemsTable.order);

        if (rows.length === 0) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        const module = rows[0].module;
        const moduleItems = rows
          .filter((row) => row.item !== null)
          .map((row) => row.item!);

        const videoIds = moduleItems
          .filter((item) => item.contentType === "video")
          .map((item) => item.contentId);
        const documentIds = moduleItems
          .filter((item) => item.contentType === "document")
          .map((item) => item.contentId);
        const quizIds = moduleItems
          .filter((item) => item.contentType === "quiz")
          .map((item) => item.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select().from(videosTable).where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db.select().from(documentsTable).where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db.select().from(quizzesTable).where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const videoMap = new Map(videos.map((v) => [v.id, withVideoUrl(v)]));
        const documentMap = new Map(documents.map((d) => [d.id, withFileUrl(d)]));
        const quizMap = new Map(quizzes.map((q) => [q.id, q]));

        const items: ModuleItem[] = moduleItems
          .map((item) => {
            let content: VideoWithUrl | DocumentWithUrl | SelectQuiz | undefined;

            if (item.contentType === "video") {
              content = videoMap.get(item.contentId);
            } else if (item.contentType === "document") {
              content = documentMap.get(item.contentId);
            } else if (item.contentType === "quiz") {
              content = quizMap.get(item.contentId);
            }

            if (!content) return null;

            return {
              id: item.id,
              contentType: item.contentType,
              contentId: item.contentId,
              order: item.order,
              isPreview: item.isPreview,
              content,
            };
          })
          .filter((item): item is ModuleItem => item !== null);

        const moduleWithItems: ModuleWithItems = {
          ...module,
          items,
          itemsCount: items.length,
        };

        return { module: moduleWithItems };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Get module by ID with items",
      },
    }
  )
  .post(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create modules",
            403
          );
        }

        const [maxOrder] = await db
          .select({ maxOrder: modulesTable.order })
          .from(modulesTable)
          .where(eq(modulesTable.tenantId, ctx.user.tenantId))
          .orderBy(desc(modulesTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const [module] = await db
          .insert(modulesTable)
          .values({
            tenantId: ctx.user.tenantId,
            title: ctx.body.title,
            description: ctx.body.description,
            status: ctx.body.status ?? "draft",
            order: nextOrder,
          })
          .returning();

        updateModuleEmbedding(module.id, module.title, module.description);

        return { module: { ...module, itemsCount: 0, items: [] } };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        status: t.Optional(
          t.Enum(Object.fromEntries(moduleStatusEnum.enumValues.map((v) => [v, v])))
        ),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Create a new module",
      },
    }
  )
  .put(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update modules",
            403
          );
        }

        const [existingModule] = await db
          .select()
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.id, ctx.params.id),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        const updateData: Partial<SelectModule> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.description !== undefined) updateData.description = ctx.body.description;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

        const [updatedModule] = await db
          .update(modulesTable)
          .set(updateData)
          .where(eq(modulesTable.id, ctx.params.id))
          .returning();

        if (ctx.body.title !== undefined || ctx.body.description !== undefined) {
          updateModuleEmbedding(updatedModule.id, updatedModule.title, updatedModule.description);
        }

        const [itemsCount] = await db
          .select({ count: count() })
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.moduleId, ctx.params.id));

        return { module: { ...updatedModule, itemsCount: itemsCount.count } };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.Optional(
          t.Enum(Object.fromEntries(moduleStatusEnum.enumValues.map((v) => [v, v])))
        ),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Update a module",
      },
    }
  )
  .delete(
    "/bulk",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete modules",
            403
          );
        }

        const { ids } = ctx.body;

        if (ids.length === 0) {
          return { success: true, deleted: 0 };
        }

        const modules = await db
          .select({ id: modulesTable.id })
          .from(modulesTable)
          .where(
            and(
              inArray(modulesTable.id, ids),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          );

        if (modules.length !== ids.length) {
          throw new AppError(ErrorCode.NOT_FOUND, "Some modules not found", 404);
        }

        await db.delete(modulesTable).where(inArray(modulesTable.id, ids));

        return { success: true, deleted: ids.length };
      }),
    {
      body: t.Object({
        ids: t.Array(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Delete multiple modules",
      },
    }
  )
  .delete(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete modules",
            403
          );
        }

        const [existingModule] = await db
          .select()
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.id, ctx.params.id),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        await db.delete(modulesTable).where(eq(modulesTable.id, ctx.params.id));

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Delete a module",
      },
    }
  )
  .put(
    "/:id/items",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageModules =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageModules) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update module items",
            403
          );
        }

        const [existingModule] = await db
          .select()
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.id, ctx.params.id),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        await db.transaction(async (tx) => {
          await tx
            .delete(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, ctx.params.id));

          if (ctx.body.items.length > 0) {
            await tx.insert(moduleItemsTable).values(
              ctx.body.items.map((item, index) => ({
                moduleId: ctx.params.id,
                contentType: item.contentType as ContentType,
                contentId: item.contentId,
                order: item.order ?? index,
                isPreview: item.isPreview ?? false,
              }))
            );
          }
        });

        const moduleItems = await db
          .select()
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.moduleId, ctx.params.id))
          .orderBy(moduleItemsTable.order);

        const videoIds = moduleItems
          .filter((item) => item.contentType === "video")
          .map((item) => item.contentId);
        const documentIds = moduleItems
          .filter((item) => item.contentType === "document")
          .map((item) => item.contentId);
        const quizIds = moduleItems
          .filter((item) => item.contentType === "quiz")
          .map((item) => item.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select().from(videosTable).where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db.select().from(documentsTable).where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db.select().from(quizzesTable).where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const videoMap = new Map(videos.map((v) => [v.id, withVideoUrl(v)]));
        const documentMap = new Map(documents.map((d) => [d.id, withFileUrl(d)]));
        const quizMap = new Map(quizzes.map((q) => [q.id, q]));

        const items: ModuleItem[] = moduleItems
          .map((item) => {
            let content: VideoWithUrl | DocumentWithUrl | SelectQuiz | undefined;

            if (item.contentType === "video") {
              content = videoMap.get(item.contentId);
            } else if (item.contentType === "document") {
              content = documentMap.get(item.contentId);
            } else if (item.contentType === "quiz") {
              content = quizMap.get(item.contentId);
            }

            if (!content) return null;

            return {
              id: item.id,
              contentType: item.contentType,
              contentId: item.contentId,
              order: item.order,
              isPreview: item.isPreview,
              content,
            };
          })
          .filter((item): item is ModuleItem => item !== null);

        const moduleWithItems: ModuleWithItems = {
          ...existingModule,
          items,
          itemsCount: items.length,
        };

        return { module: moduleWithItems };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        items: t.Array(
          t.Object({
            contentType: t.Enum(Object.fromEntries(contentTypeEnum.enumValues.map((v) => [v, v]))),
            contentId: t.String({ format: "uuid" }),
            order: t.Optional(t.Number({ minimum: 0 })),
            isPreview: t.Optional(t.Boolean()),
          })
        ),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Batch update module items (replaces all)",
      },
    }
  );
