import { Elysia, t } from "elysia";
import { authPlugin, invalidateUserCache, type UserWithoutPassword } from "@/plugins/auth";
import { invalidateTenantCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { tenantsTable, usersTable } from "@/db/schema";
import { count, eq, sql, and, ne } from "drizzle-orm";
import { uploadBase64ToS3, getPresignedUrl, deleteFromS3 } from "@/lib/upload";

const RESERVED_SLUGS = ["www", "api", "admin", "app", "backoffice", "dashboard"];
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

const tenantFieldMap: FieldMap<typeof tenantsTable> = {
  id: tenantsTable.id,
  name: tenantsTable.name,
  slug: tenantsTable.slug,
  createdAt: tenantsTable.createdAt,
  updatedAt: tenantsTable.updatedAt,
};

const tenantSearchableFields: SearchableFields<typeof tenantsTable> = [
  tenantsTable.name,
  tenantsTable.slug,
];

const tenantDateFields: DateFields = new Set(["createdAt"]);

function checkCanCreateTenant(user: UserWithoutPassword | null, userRole: string | null) {
  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }
  if (userRole === "superadmin") {
    return;
  }
  if (userRole === "owner") {
    if (user.tenantId !== null) {
      throw new AppError(
        ErrorCode.OWNER_ALREADY_HAS_TENANT,
        "You already have a tenant",
        400
      );
    }
    return;
  }
  throw new AppError(
    ErrorCode.FORBIDDEN,
    "Only superadmins and owners can create tenants",
    403
  );
}

export const tenantsRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        checkCanCreateTenant(ctx.user, ctx.userRole);

        const result = await db.transaction(async (tx) => {
          // Use INSERT ON CONFLICT to avoid separate SELECT query
          const [tenant] = await tx
            .insert(tenantsTable)
            .values({ slug: ctx.body.slug, name: ctx.body.name })
            .onConflictDoNothing({ target: tenantsTable.slug })
            .returning();

          if (!tenant) {
            throw new AppError(
              ErrorCode.TENANT_SLUG_EXISTS,
              "Tenant slug already exists",
              409
            );
          }

          // If owner, link them to this tenant (in same transaction)
          if (ctx.userRole === "owner" && ctx.user) {
            await tx
              .update(usersTable)
              .set({ tenantId: tenant.id })
              .where(eq(usersTable.id, ctx.user.id));
          }

          return { tenant };
        });

        if (ctx.userRole === "owner" && ctx.user) {
          invalidateUserCache(ctx.user.id);
        }

        return result;
      }),
    {
      body: t.Object({
        slug: t.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
        name: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Create a new tenant (superadmin or owner)",
      },
    }
  )
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        // Owner sees only their tenant (no pagination)
        if (ctx.userRole === "owner") {
          if (!ctx.user.tenantId) {
            return { tenants: [], pagination: null };
          }
          const tenants = await db
            .select()
            .from(tenantsTable)
            .where(eq(tenantsTable.id, ctx.user.tenantId));
          return { tenants, pagination: null };
        }

        // Superadmin sees all tenants with pagination
        if (ctx.userRole !== "superadmin") {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const params = parseListParams(ctx.query);
        const whereClause = buildWhereClause(
          params,
          tenantFieldMap,
          tenantSearchableFields,
          tenantDateFields
        );

        const usersCountSubquery = db
          .select({
            tenantId: usersTable.tenantId,
            usersCount: count(usersTable.id).as("users_count"),
          })
          .from(usersTable)
          .groupBy(usersTable.tenantId)
          .as("users_count_sq");

        const baseQuery = db
          .select({
            id: tenantsTable.id,
            slug: tenantsTable.slug,
            name: tenantsTable.name,
            createdAt: tenantsTable.createdAt,
            updatedAt: tenantsTable.updatedAt,
            usersCount: sql<number>`COALESCE(${usersCountSubquery.usersCount}, 0)`.as(
              "users_count"
            ),
          })
          .from(tenantsTable)
          .leftJoin(
            usersCountSubquery,
            eq(tenantsTable.id, usersCountSubquery.tenantId)
          );

        const sortColumn = getSortColumn(params.sort, tenantFieldMap, {
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

        const countQuery = db.select({ count: count() }).from(tenantsTable);
        const countWithWhere = whereClause
          ? countQuery.where(whereClause)
          : countQuery;

        const [tenants, [{ count: total }]] = await Promise.all([
          query,
          countWithWhere,
        ]);

        return {
          tenants,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "List tenants (superadmin: paginated, owner: their tenant)",
      },
    }
  )
  .get(
    "/:slug",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [tenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.slug, ctx.params.slug))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        // Superadmin can see any tenant
        if (ctx.userRole === "superadmin") {
          return { tenant };
        }

        // Owner can only see their own tenant
        if (ctx.userRole === "owner" && ctx.user.tenantId === tenant.id) {
          return { tenant };
        }

        throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
      }),
    {
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant by slug (superadmin or owner)",
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

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (ctx.body.slug && ctx.body.slug !== existingTenant.slug) {
          if (RESERVED_SLUGS.includes(ctx.body.slug)) {
            throw new AppError(
              ErrorCode.BAD_REQUEST,
              "This slug is reserved",
              400
            );
          }

          const [existingSlug] = await db
            .select({ id: tenantsTable.id })
            .from(tenantsTable)
            .where(
              and(
                eq(tenantsTable.slug, ctx.body.slug),
                ne(tenantsTable.id, ctx.params.id)
              )
            )
            .limit(1);

          if (existingSlug) {
            throw new AppError(
              ErrorCode.TENANT_SLUG_EXISTS,
              "Slug already exists",
              409
            );
          }
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({
            slug: ctx.body.slug ?? existingTenant.slug,
            name: ctx.body.name,
            primaryColor: ctx.body.primaryColor,
            description: ctx.body.description,
            contactEmail: ctx.body.contactEmail,
            contactPhone: ctx.body.contactPhone,
            contactAddress: ctx.body.contactAddress,
            socialLinks: ctx.body.socialLinks,
            seoTitle: ctx.body.seoTitle,
            seoDescription: ctx.body.seoDescription,
            seoKeywords: ctx.body.seoKeywords,
          })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);
        if (ctx.body.slug && ctx.body.slug !== existingTenant.slug) {
          invalidateTenantCache(ctx.body.slug);
        }

        return { tenant: updatedTenant };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        slug: t.Optional(t.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
        name: t.String({ minLength: 1 }),
        primaryColor: t.Optional(t.Nullable(t.String())),
        description: t.Optional(t.Nullable(t.String())),
        contactEmail: t.Optional(t.Nullable(t.String())),
        contactPhone: t.Optional(t.Nullable(t.String())),
        contactAddress: t.Optional(t.Nullable(t.String())),
        socialLinks: t.Optional(
          t.Nullable(
            t.Object({
              twitter: t.Optional(t.String()),
              facebook: t.Optional(t.String()),
              instagram: t.Optional(t.String()),
              linkedin: t.Optional(t.String()),
              youtube: t.Optional(t.String()),
            })
          )
        ),
        seoTitle: t.Optional(t.Nullable(t.String())),
        seoDescription: t.Optional(t.Nullable(t.String())),
        seoKeywords: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Update tenant (superadmin or owner)",
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
            "Only superadmins can delete tenants",
            403
          );
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        await db.delete(tenantsTable).where(eq(tenantsTable.id, ctx.params.id));

        invalidateTenantCache(existingTenant.slug);

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Delete tenant (superadmin only)",
      },
    }
  )
  .post(
    "/:id/logo",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (!ctx.body.logo.startsWith("data:image/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Logo must be an image", 400);
        }

        const [, logoKey] = await Promise.all([
          existingTenant.logo
            ? deleteFromS3(existingTenant.logo)
            : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.logo,
            folder: "logos",
            userId: ctx.params.id,
          }),
        ]);

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ logo: logoKey })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return {
          logoKey,
          logoUrl: getPresignedUrl(logoKey),
          tenant: updatedTenant,
        };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        logo: t.String(),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Upload tenant logo",
      },
    }
  )
  .delete(
    "/:id/logo",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (existingTenant.logo) {
          await deleteFromS3(existingTenant.logo);
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ logo: null })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return { tenant: updatedTenant };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Delete tenant logo",
      },
    }
  );
