import { Elysia, t } from "elysia";
import { authPlugin, invalidateUserCache } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  tenantsTable,
  usersTable,
  userRoleEnum,
  type SelectUser,
} from "@/db/schema";
import { count, eq, ilike, and } from "drizzle-orm";
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

type UserWithoutPassword = Omit<SelectUser, "password">;

const userFieldMap: FieldMap<typeof usersTable> = {
  id: usersTable.id,
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

const userSearchableFields: SearchableFields<typeof usersTable> = [
  usersTable.name,
  usersTable.email,
];

const userDateFields: DateFields = new Set(["createdAt"]);

function excludePassword(user: SelectUser): UserWithoutPassword {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const usersRoutes = new Elysia()
  .use(tenantPlugin)
  .use(authPlugin)
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.SUPERADMIN_REQUIRED,
            "Only superadmins can list all users",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          userFieldMap,
          userSearchableFields,
          userDateFields
        );

        const tenantNameFilter = ctx.query.tenantId
          ? ilike(tenantsTable.name, `%${ctx.query.tenantId}%`)
          : undefined;

        const whereClause = baseWhereClause && tenantNameFilter
          ? and(baseWhereClause, tenantNameFilter)
          : baseWhereClause ?? tenantNameFilter;

        const baseQuery = db
          .select({
            id: usersTable.id,
            email: usersTable.email,
            name: usersTable.name,
            avatar: usersTable.avatar,
            role: usersTable.role,
            tenantId: usersTable.tenantId,
            createdAt: usersTable.createdAt,
            updatedAt: usersTable.updatedAt,
            tenantName: tenantsTable.name,
            tenantSlug: tenantsTable.slug,
          })
          .from(usersTable)
          .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id));

        const sortColumn = getSortColumn(params.sort, userFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        let query = baseQuery.$dynamic();
        if (whereClause) {
          query = query.where(whereClause);
        }
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(usersTable)
          .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id));

        const countWithWhere = whereClause
          ? countQuery.where(whereClause)
          : countQuery;

        const [users, [{ count: total }]] = await Promise.all([
          query,
          countWithWhere,
        ]);

        return {
          users: users.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
            role: user.role,
            tenantId: user.tenantId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            tenant: user.tenantId
              ? { id: user.tenantId, name: user.tenantName, slug: user.tenantSlug }
              : null,
          })),
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        tenantId: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "List all users with pagination and filters (superadmin only)",
      },
    }
  )
  .get(
    "/tenant",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canManageTenantUsers =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          (ctx.userRole === "superadmin" && (ctx.user.tenantId || ctx.tenant));

        if (!canManageTenantUsers) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can list tenant users",
            403
          );
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
        }

        if (ctx.userRole === "owner" && ctx.user.tenantId && ctx.user.tenantId !== effectiveTenantId) {
          throw new AppError(ErrorCode.FORBIDDEN, "Cannot access other tenant's users", 403);
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          userFieldMap,
          userSearchableFields,
          userDateFields
        );

        const tenantFilter = eq(usersTable.tenantId, effectiveTenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const baseQuery = db
          .select({
            id: usersTable.id,
            email: usersTable.email,
            name: usersTable.name,
            avatar: usersTable.avatar,
            role: usersTable.role,
            tenantId: usersTable.tenantId,
            createdAt: usersTable.createdAt,
            updatedAt: usersTable.updatedAt,
          })
          .from(usersTable);

        const sortColumn = getSortColumn(params.sort, userFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        let query = baseQuery.$dynamic();
        query = query.where(whereClause);
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(usersTable)
          .where(whereClause);

        const [users, [{ count: total }]] = await Promise.all([
          query,
          countQuery,
        ]);

        return {
          users: users.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
            role: user.role,
            tenantId: user.tenantId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "List tenant users with pagination and filters (owner/admin only)",
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

        if (ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.SUPERADMIN_REQUIRED,
            "Only superadmins can view user details",
            403
          );
        }

        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, ctx.params.id))
          .limit(1);

        if (!user) {
          throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
        }

        return { user: excludePassword(user) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get user by ID (superadmin only)",
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

        if (ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.SUPERADMIN_REQUIRED,
            "Only superadmins can update users",
            403
          );
        }

        const [existingUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, ctx.params.id))
          .limit(1);

        if (!existingUser) {
          throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
        }

        if (ctx.body.tenantId) {
          const [tenant] = await db
            .select()
            .from(tenantsTable)
            .where(eq(tenantsTable.id, ctx.body.tenantId))
            .limit(1);

          if (!tenant) {
            throw new AppError(
              ErrorCode.TENANT_NOT_FOUND,
              "Tenant not found",
              404
            );
          }
        }

        const updateData: Partial<SelectUser> = {};
        if (ctx.body.name !== undefined) updateData.name = ctx.body.name;
        if (ctx.body.role !== undefined) updateData.role = ctx.body.role;
        if (ctx.body.tenantId !== undefined)
          updateData.tenantId = ctx.body.tenantId;

        const [updatedUser] = await db
          .update(usersTable)
          .set(updateData)
          .where(eq(usersTable.id, ctx.params.id))
          .returning();

        invalidateUserCache(ctx.params.id);

        return { user: excludePassword(updatedUser) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        role: t.Optional(t.Enum(Object.fromEntries(userRoleEnum.enumValues.map((v) => [v, v])))),
        tenantId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update user (superadmin only)",
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

        if (ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.SUPERADMIN_REQUIRED,
            "Only superadmins can delete users",
            403
          );
        }

        if (ctx.params.id === ctx.user.id) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Cannot delete your own account",
            400
          );
        }

        const [existingUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, ctx.params.id))
          .limit(1);

        if (!existingUser) {
          throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
        }

        await db.delete(usersTable).where(eq(usersTable.id, ctx.params.id));

        invalidateUserCache(ctx.params.id);

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Delete user (superadmin only)",
      },
    }
  );
