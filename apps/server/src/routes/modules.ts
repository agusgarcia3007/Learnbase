import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  modulesTable,
  moduleLessonsTable,
  lessonsTable,
  moduleStatusEnum,
  type SelectModule,
  type SelectLesson,
} from "@/db/schema";
import { count, eq, and, desc } from "drizzle-orm";
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

type ModuleWithLessons = SelectModule & {
  lessons: Array<{
    id: string;
    lessonId: string;
    order: number;
    lesson: SelectLesson & { videoUrl: string | null };
  }>;
  lessonsCount: number;
};

function withLessonVideoUrl(lesson: SelectLesson): SelectLesson & { videoUrl: string | null } {
  return {
    ...lesson,
    videoUrl: lesson.videoKey ? getPresignedUrl(lesson.videoKey) : null,
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

        const modulesQuery = db
          .select()
          .from(modulesTable)
          .where(whereClause)
          .orderBy(sortColumn ?? desc(modulesTable.createdAt))
          .limit(limit)
          .offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(modulesTable)
          .where(whereClause);

        const [modules, [{ count: total }]] = await Promise.all([
          modulesQuery,
          countQuery,
        ]);

        const moduleIds = modules.map((m) => m.id);

        const lessonsCounts = moduleIds.length > 0
          ? await db
              .select({
                moduleId: moduleLessonsTable.moduleId,
                count: count(),
              })
              .from(moduleLessonsTable)
              .where(
                moduleIds.length === 1
                  ? eq(moduleLessonsTable.moduleId, moduleIds[0])
                  : undefined
              )
              .groupBy(moduleLessonsTable.moduleId)
          : [];

        const lessonsCountMap = new Map(
          lessonsCounts.map((lc) => [lc.moduleId, lc.count])
        );

        const modulesWithCounts = modules.map((module) => ({
          ...module,
          lessonsCount: lessonsCountMap.get(module.id) ?? 0,
        }));

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

        const [module] = await db
          .select()
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.id, ctx.params.id),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!module) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        const moduleLessons = await db
          .select({
            id: moduleLessonsTable.id,
            lessonId: moduleLessonsTable.lessonId,
            order: moduleLessonsTable.order,
            lesson: lessonsTable,
          })
          .from(moduleLessonsTable)
          .innerJoin(lessonsTable, eq(moduleLessonsTable.lessonId, lessonsTable.id))
          .where(eq(moduleLessonsTable.moduleId, ctx.params.id))
          .orderBy(moduleLessonsTable.order);

        const moduleWithLessons: ModuleWithLessons = {
          ...module,
          lessons: moduleLessons.map((ml) => ({
            ...ml,
            lesson: withLessonVideoUrl(ml.lesson),
          })),
          lessonsCount: moduleLessons.length,
        };

        return { module: moduleWithLessons };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Get module by ID with lessons",
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

        return { module: { ...module, lessonsCount: 0 } };
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

        const [lessonsCount] = await db
          .select({ count: count() })
          .from(moduleLessonsTable)
          .where(eq(moduleLessonsTable.moduleId, ctx.params.id));

        return { module: { ...updatedModule, lessonsCount: lessonsCount.count } };
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
    "/:id/lessons",
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
            "Only owners and admins can update module lessons",
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
            .delete(moduleLessonsTable)
            .where(eq(moduleLessonsTable.moduleId, ctx.params.id));

          if (ctx.body.lessons.length > 0) {
            await tx.insert(moduleLessonsTable).values(
              ctx.body.lessons.map((lesson, index) => ({
                moduleId: ctx.params.id,
                lessonId: lesson.lessonId,
                order: lesson.order ?? index,
              }))
            );
          }
        });

        const moduleLessons = await db
          .select({
            id: moduleLessonsTable.id,
            lessonId: moduleLessonsTable.lessonId,
            order: moduleLessonsTable.order,
            lesson: lessonsTable,
          })
          .from(moduleLessonsTable)
          .innerJoin(lessonsTable, eq(moduleLessonsTable.lessonId, lessonsTable.id))
          .where(eq(moduleLessonsTable.moduleId, ctx.params.id))
          .orderBy(moduleLessonsTable.order);

        const moduleWithLessons: ModuleWithLessons = {
          ...existingModule,
          lessons: moduleLessons.map((ml) => ({
            ...ml,
            lesson: withLessonVideoUrl(ml.lesson),
          })),
          lessonsCount: moduleLessons.length,
        };

        return { module: moduleWithLessons };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        lessons: t.Array(
          t.Object({
            lessonId: t.String({ format: "uuid" }),
            order: t.Optional(t.Number({ minimum: 0 })),
          })
        ),
      }),
      detail: {
        tags: ["Modules"],
        summary: "Batch update module lessons (replaces all)",
      },
    }
  );
