import { Elysia, t } from "elysia";
import { authPlugin, type UserWithoutPassword } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { tenantsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export const tenantsRoutes = new Elysia().use(authPlugin);

tenantsRoutes.post(
  "/",
  (ctx) =>
    withHandler(ctx, async () => {
      checkCanCreateTenant(ctx.user, ctx.userRole);

      const [existing] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.slug, ctx.body.slug))
        .limit(1);

      if (existing) {
        throw new AppError(
          ErrorCode.TENANT_SLUG_EXISTS,
          "Tenant slug already exists",
          409
        );
      }

      const [tenant] = await db
        .insert(tenantsTable)
        .values({ slug: ctx.body.slug, name: ctx.body.name })
        .returning();

      // If owner, link them to this tenant
      if (ctx.userRole === "owner" && ctx.user) {
        await db
          .update(usersTable)
          .set({ tenantId: tenant.id })
          .where(eq(usersTable.id, ctx.user.id));
      }

      return { tenant };
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
);

tenantsRoutes.get(
  "/",
  (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      // Superadmin sees all tenants
      if (ctx.userRole === "superadmin") {
        const tenants = await db.select().from(tenantsTable);
        return { tenants };
      }

      // Owner sees only their tenant
      if (ctx.userRole === "owner") {
        if (!ctx.user.tenantId) {
          return { tenants: [] };
        }
        const tenants = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.user.tenantId));
        return { tenants };
      }

      throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
    }),
  {
    detail: {
      tags: ["Tenants"],
      summary: "List tenants (superadmin: all, owner: their tenant)",
    },
  }
);

tenantsRoutes.get(
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
);
