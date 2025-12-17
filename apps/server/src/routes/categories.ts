import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  categoriesTable,
  courseCategoriesTable,
  type SelectCategory,
} from "@/db/schema";
import { count, eq, and, desc, inArray } from "drizzle-orm";
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

const categoryFieldMap: FieldMap<typeof categoriesTable> = {
  id: categoriesTable.id,
  name: categoriesTable.name,
  slug: categoriesTable.slug,
  order: categoriesTable.order,
  createdAt: categoriesTable.createdAt,
  updatedAt: categoriesTable.updatedAt,
};

const categorySearchableFields: SearchableFields<typeof categoriesTable> = [
  categoriesTable.name,
];

const categoryDateFields: DateFields = new Set(["createdAt"]);

export const categoriesRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageCategories =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageCategories) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can manage categories",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          categoryFieldMap,
          categorySearchableFields,
          categoryDateFields
        );

        const tenantFilter = eq(categoriesTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, categoryFieldMap, {
          field: "order",
          order: "asc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const categoriesQuery = db
          .select()
          .from(categoriesTable)
          .where(whereClause)
          .orderBy(sortColumn ?? categoriesTable.order)
          .limit(limit)
          .offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(categoriesTable)
          .where(whereClause);

        const [categories, [{ count: total }]] = await Promise.all([
          categoriesQuery,
          countQuery,
        ]);

        const categoryIds = categories.map((c) => c.id);

        const coursesCounts =
          categoryIds.length > 0
            ? await db
                .select({
                  categoryId: courseCategoriesTable.categoryId,
                  count: count(),
                })
                .from(courseCategoriesTable)
                .where(inArray(courseCategoriesTable.categoryId, categoryIds))
                .groupBy(courseCategoriesTable.categoryId)
            : [];

        const coursesCountMap = new Map(
          coursesCounts.map((cc) => [cc.categoryId, cc.count])
        );

        const categoriesWithCounts = categories.map((category) => ({
          ...category,
          coursesCount: coursesCountMap.get(category.id) ?? 0,
        }));

        return {
          categories: categoriesWithCounts,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Categories"],
        summary: "List categories with pagination and filters",
      },
    }
  )
  .get(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [category] = await db
          .select()
          .from(categoriesTable)
          .where(
            and(
              eq(categoriesTable.id, ctx.params.id),
              eq(categoriesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!category) {
          throw new AppError(ErrorCode.NOT_FOUND, "Category not found", 404);
        }

        const [coursesCount] = await db
          .select({ count: count() })
          .from(courseCategoriesTable)
          .where(eq(courseCategoriesTable.categoryId, category.id));

        return {
          category: {
            ...category,
            coursesCount: coursesCount.count,
          },
        };
      },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Get category by ID",
      },
    }
  )
  .post(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageCategories =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageCategories) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can create categories",
            403
          );
        }

        const [maxOrder] = await db
          .select({ maxOrder: categoriesTable.order })
          .from(categoriesTable)
          .where(eq(categoriesTable.tenantId, ctx.user.tenantId))
          .orderBy(desc(categoriesTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const slug =
          ctx.body.slug ||
          ctx.body.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const [category] = await db
          .insert(categoriesTable)
          .values({
            tenantId: ctx.user.tenantId,
            name: ctx.body.name,
            slug,
            description: ctx.body.description,
            order: nextOrder,
          })
          .returning();

        return { category: { ...category, coursesCount: 0 } };
      },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Create a new category",
      },
    }
  )
  .put(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageCategories =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageCategories) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can update categories",
            403
          );
        }

        const [existingCategory] = await db
          .select()
          .from(categoriesTable)
          .where(
            and(
              eq(categoriesTable.id, ctx.params.id),
              eq(categoriesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingCategory) {
          throw new AppError(ErrorCode.NOT_FOUND, "Category not found", 404);
        }

        const updateData: Partial<SelectCategory> = {};
        if (ctx.body.name !== undefined) updateData.name = ctx.body.name;
        if (ctx.body.slug !== undefined) updateData.slug = ctx.body.slug;
        if (ctx.body.description !== undefined)
          updateData.description = ctx.body.description;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

        const [updatedCategory] = await db
          .update(categoriesTable)
          .set(updateData)
          .where(eq(categoriesTable.id, ctx.params.id))
          .returning();

        const [coursesCount] = await db
          .select({ count: count() })
          .from(courseCategoriesTable)
          .where(eq(courseCategoriesTable.categoryId, ctx.params.id));

        return {
          category: { ...updatedCategory, coursesCount: coursesCount.count },
        };
      },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        slug: t.Optional(t.String()),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Update a category",
      },
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageCategories =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageCategories) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can delete categories",
            403
          );
        }

        const [existingCategory] = await db
          .select()
          .from(categoriesTable)
          .where(
            and(
              eq(categoriesTable.id, ctx.params.id),
              eq(categoriesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingCategory) {
          throw new AppError(ErrorCode.NOT_FOUND, "Category not found", 404);
        }

        await db
          .delete(categoriesTable)
          .where(eq(categoriesTable.id, ctx.params.id));

        return { success: true };
      },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Delete a category",
      },
    }
  );
