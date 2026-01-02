import { Elysia, t } from "elysia";
import { authPlugin, invalidateUserCache } from "@/plugins/auth";
import { tenantPlugin, invalidateTenantCache } from "@/plugins/tenant";
import { jwtPlugin } from "@/plugins/jwt";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { getTenantClientUrl, sendEmail } from "@/lib/utils";
import { CLIENT_URL } from "@/lib/constants";
import { getInvitationEmailHtml } from "@/lib/email-templates";
import { getEmailTranslations, interpolate } from "@/lib/email-translations";
import { db } from "@/db";
import {
  tenantsTable,
  usersTable,
  userRoleEnum,
  refreshTokensTable,
  enrollmentsTable,
  type SelectUser,
} from "@/db/schema";
import { count, eq, ilike, and, inArray, sql } from "drizzle-orm";
import {
  parseListParams,
  buildWhereClause,
  buildTextFilter,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type SearchableFields,
  type DateFields,
} from "@/lib/filters";
import { getPresignedUrl } from "@/lib/upload";
import { enqueue } from "@/jobs";

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
  .use(jwtPlugin)
  .use(guardPlugin)
  .get(
    "/",
    async (ctx) => {
      const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          userFieldMap,
          userSearchableFields,
          userDateFields
        );

        const tenantNameFilter = buildTextFilter(ctx.query.tenantId, tenantsTable.name);

        const conditions = [baseWhereClause, tenantNameFilter].filter(Boolean);
        const whereClause = conditions.length > 1
          ? and(...conditions)
          : conditions[0];

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
    },
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
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .get(
    "/tenant",
    async (ctx) => {
      const canManageTenantUsers =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        (ctx.userRole === "superadmin" && (ctx.user!.tenantId || ctx.tenant));

        if (!canManageTenantUsers) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can list tenant users",
            403
          );
        }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      if (ctx.userRole === "owner" && ctx.user!.tenantId && ctx.user!.tenantId !== effectiveTenantId) {
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
            emailVerified: usersTable.emailVerified,
            enrollmentsCount: sql<number>`(
              SELECT COUNT(*) FROM ${enrollmentsTable}
              WHERE ${enrollmentsTable.userId} = ${usersTable.id}
            )`.as("enrollments_count"),
            completedCount: sql<number>`(
              SELECT COUNT(*) FROM ${enrollmentsTable}
              WHERE ${enrollmentsTable.userId} = ${usersTable.id} AND ${enrollmentsTable.status} = 'completed'
            )`.as("completed_count"),
            lastActivity: sql<string | null>`(
              SELECT MAX(${enrollmentsTable.updatedAt}) FROM ${enrollmentsTable}
              WHERE ${enrollmentsTable.userId} = ${usersTable.id}
            )`.as("last_activity"),
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
            emailVerified: user.emailVerified,
            enrollmentsCount: Number(user.enrollmentsCount) || 0,
            completedCount: Number(user.completedCount) || 0,
            lastActivity: user.lastActivity,
          })),
          pagination: calculatePagination(total, params.page, params.limit),
        };
    },
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
      requireAuth: true,
    }
  )
  .get(
    "/:id",
    async (ctx) => {
      const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, ctx.params.id))
          .limit(1);

        if (!user) {
          throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
        }

        return { user: excludePassword(user) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get user by ID (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .put(
    "/:id",
    async (ctx) => {
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

        if (ctx.body.name !== undefined) {
          await enqueue({
            type: "sync-connected-customer",
            data: {
              userId: ctx.params.id,
              email: updatedUser.email,
              name: updatedUser.name,
            },
          });
        }

        return { user: excludePassword(updatedUser) };
    },
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
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
      if (ctx.params.id === ctx.user!.id) {
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

        if (existingUser.role === "owner" && existingUser.tenantId) {
          const [tenant] = await db
            .select({ slug: tenantsTable.slug })
            .from(tenantsTable)
            .where(eq(tenantsTable.id, existingUser.tenantId))
            .limit(1);

          await db.delete(tenantsTable).where(eq(tenantsTable.id, existingUser.tenantId));

          if (tenant) {
            invalidateTenantCache(tenant.slug);
          }
        } else {
          await db.delete(usersTable).where(eq(usersTable.id, ctx.params.id));
        }

        invalidateUserCache(ctx.params.id);

        return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Delete user (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .post(
    "/:id/impersonate",
    async (ctx) => {
      const [targetUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.params.id))
        .limit(1);

      if (!targetUser) {
        throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
      }

      if (targetUser.role === "superadmin") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Cannot impersonate superadmins",
          403
        );
      }

      let tenantSlug: string | null = null;
      if (targetUser.tenantId) {
        const [tenant] = await db
          .select({ slug: tenantsTable.slug })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, targetUser.tenantId))
          .limit(1);
        tenantSlug = tenant?.slug ?? null;
      }

      const [accessToken, refreshToken] = await Promise.all([
        ctx.jwt.sign({
          sub: targetUser.id,
          role: targetUser.role,
          tenantId: targetUser.tenantId,
        }),
        ctx.refreshJwt.sign({
          sub: targetUser.id,
          role: targetUser.role,
          tenantId: targetUser.tenantId,
        }),
      ]);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await db.insert(refreshTokensTable).values({
        token: refreshToken,
        userId: targetUser.id,
        expiresAt,
      });

      const { password: _, ...userWithoutPassword } = targetUser;

      return {
        user: { ...userWithoutPassword, tenantSlug },
        accessToken,
        refreshToken,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Impersonate user (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .put(
    "/tenant/:id",
    async (ctx) => {
      const canManageUsers =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageUsers) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can update tenant users",
            403
          );
        }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, ctx.params.id),
            eq(usersTable.tenantId, effectiveTenantId)
          )
        )
        .limit(1);

      if (!existingUser) {
        throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found in tenant", 404);
      }

      if (ctx.params.id === ctx.user!.id && ctx.body.role !== undefined) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Cannot change your own role",
            400
          );
        }

        if (existingUser.role === "owner" && ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Cannot modify owner account",
            403
          );
        }

        const updateData: Partial<SelectUser> = {};
        if (ctx.body.name !== undefined) updateData.name = ctx.body.name;
        if (ctx.body.role !== undefined) updateData.role = ctx.body.role;

        const [updatedUser] = await db
          .update(usersTable)
          .set(updateData)
          .where(eq(usersTable.id, ctx.params.id))
          .returning();

        invalidateUserCache(ctx.params.id);

        if (ctx.body.name !== undefined) {
          await enqueue({
            type: "sync-connected-customer",
            data: {
              userId: ctx.params.id,
              email: updatedUser.email,
              name: updatedUser.name,
            },
          });
        }

        return { user: excludePassword(updatedUser) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        role: t.Optional(t.Union([t.Literal("instructor"), t.Literal("student")])),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update tenant user (owner/admin only)",
      },
      requireAuth: true,
    }
  )
  .post(
    "/tenant/invite",
    async (ctx) => {
      const canInviteUsers =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canInviteUsers) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can invite users",
            403
          );
        }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      const [tenant] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.id, effectiveTenantId))
        .limit(1);

      if (!tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.email, ctx.body.email),
            eq(usersTable.tenantId, effectiveTenantId)
          )
        )
        .limit(1);

      if (existing) {
        throw new AppError(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          "User with this email already exists in tenant",
          409
        );
      }

      const randomPassword = crypto.randomUUID();
      const hashedPassword = await Bun.password.hash(randomPassword);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: ctx.body.email,
          password: hashedPassword,
          name: ctx.body.name,
          role: ctx.body.role,
          tenantId: effectiveTenantId,
        })
        .returning();

      const resetToken = await ctx.resetJwt.sign({ sub: newUser.id });
      const baseUrl = ctx.body.role === "instructor" ? CLIENT_URL : getTenantClientUrl(tenant);
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      const logoUrl = tenant.logo ? getPresignedUrl(tenant.logo) : undefined;
      const locale = tenant.language ?? undefined;
      const t = getEmailTranslations(locale).invitation;

      await sendEmail({
        to: ctx.body.email,
        subject: interpolate(t.subject, { tenantName: tenant.name }),
        html: getInvitationEmailHtml({
          recipientName: ctx.body.name,
          tenantName: tenant.name,
          inviterName: ctx.user!.name,
          resetUrl,
          logoUrl,
          locale,
        }),
        senderName: tenant.name,
        replyTo: tenant.contactEmail || undefined,
      });

        if (tenant.stripeConnectAccountId) {
          await enqueue({
            type: "create-connected-customer",
            data: {
              userId: newUser.id,
              tenantId: tenant.id,
              email: newUser.email,
              name: newUser.name,
              stripeConnectAccountId: tenant.stripeConnectAccountId,
            },
          });
        }

        return { user: excludePassword(newUser) };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 1 }),
        role: t.Union([t.Literal("instructor"), t.Literal("student")]),
      }),
      detail: {
        tags: ["Users"],
        summary: "Invite user to tenant (owner/admin only)",
      },
      requireAuth: true,
    }
  )
  .delete(
    "/tenant/:id",
    async (ctx) => {
      const canDeleteUsers =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canDeleteUsers) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can delete tenant users",
          403
        );
      }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      if (ctx.params.id === ctx.user!.id) {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Cannot delete your own account",
          400
        );
      }

      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, ctx.params.id),
            eq(usersTable.tenantId, effectiveTenantId)
          )
        )
        .limit(1);

      if (!existingUser) {
        throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found in tenant", 404);
      }

      if (existingUser.role === "owner") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Cannot delete owner account",
          403
        );
      }

      await db.delete(usersTable).where(eq(usersTable.id, ctx.params.id));

      invalidateUserCache(ctx.params.id);

      return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Delete tenant user (owner/instructor only)",
      },
      requireAuth: true,
    }
  )
  .delete(
    "/tenant/bulk",
    async (ctx) => {
      if (ctx.userRole !== "owner" && ctx.userRole !== "superadmin") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners can bulk delete users",
          403
        );
      }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      const ids = ctx.body.ids.filter((id) => id !== ctx.user!.id);

      if (ids.length === 0) {
        throw new AppError(ErrorCode.BAD_REQUEST, "No valid users to delete", 400);
      }

        const usersToDelete = await db
          .select()
          .from(usersTable)
          .where(
            and(
              inArray(usersTable.id, ids),
              eq(usersTable.tenantId, effectiveTenantId)
            )
          );

        const ownerIds = usersToDelete
          .filter((u) => u.role === "owner")
          .map((u) => u.id);

        if (ownerIds.length > 0) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Cannot delete owner accounts",
            403
          );
        }

        const validIds = usersToDelete.map((u) => u.id);

        if (validIds.length === 0) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No valid users found", 400);
        }

        await db.delete(usersTable).where(inArray(usersTable.id, validIds));

        validIds.forEach((id) => invalidateUserCache(id));

        return { deleted: validIds.length };
    },
    {
      body: t.Object({
        ids: t.Array(t.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Bulk delete tenant users (owner only)",
      },
      requireAuth: true,
    }
  )
  .put(
    "/tenant/bulk/role",
    async (ctx) => {
      if (ctx.userRole !== "owner" && ctx.userRole !== "superadmin") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners can bulk update roles",
          403
        );
      }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      const ids = ctx.body.ids.filter((id) => id !== ctx.user!.id);

        if (ids.length === 0) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No valid users to update", 400);
        }

        const usersToUpdate = await db
          .select()
          .from(usersTable)
          .where(
            and(
              inArray(usersTable.id, ids),
              eq(usersTable.tenantId, effectiveTenantId)
            )
          );

        const ownerIds = usersToUpdate
          .filter((u) => u.role === "owner")
          .map((u) => u.id);

        if (ownerIds.length > 0) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Cannot change role of owner accounts",
            403
          );
        }

        const validIds = usersToUpdate.map((u) => u.id);

        if (validIds.length === 0) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No valid users found", 400);
        }

        await db
          .update(usersTable)
          .set({ role: ctx.body.role })
          .where(inArray(usersTable.id, validIds));

        validIds.forEach((id) => invalidateUserCache(id));

        return { updated: validIds.length };
    },
    {
      body: t.Object({
        ids: t.Array(t.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
        role: t.Union([t.Literal("instructor"), t.Literal("student")]),
      }),
      detail: {
        tags: ["Users"],
        summary: "Bulk update tenant user roles (owner only)",
      },
      requireAuth: true,
    }
  )
  .get(
    "/tenant/export",
    async (ctx) => {
      const canExport =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canExport) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can export users",
            403
          );
        }

      const effectiveTenantId = ctx.user!.tenantId ?? ctx.tenant?.id;

      if (!effectiveTenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "No tenant context", 404);
      }

      const users = await db
          .select({
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role,
            createdAt: usersTable.createdAt,
          })
          .from(usersTable)
          .where(eq(usersTable.tenantId, effectiveTenantId))
          .orderBy(usersTable.createdAt);

        const headers = ["Name", "Email", "Role", "Created At"];
        const rows = users.map((u) => [
          u.name,
          u.email,
          u.role,
          u.createdAt.toISOString(),
        ]);

        const csv = [headers, ...rows]
          .map((row) =>
            row
              .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
              .join(",")
          )
          .join("\n");

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Export tenant users to CSV (owner/admin only)",
      },
      requireAuth: true,
    }
  );
