import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const tenantsRoutes = new Elysia()
  .use(authPlugin)
  .onBeforeHandle(({ user, userRole }) => {
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    if (userRole !== "superadmin") {
      throw new AppError(
        ErrorCode.SUPERADMIN_REQUIRED,
        "Superadmin access required",
        403
      );
    }
  });

tenantsRoutes.post(
  "/",
  async ({ body }) => {
    const [existing] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, body.slug))
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
      .values({ slug: body.slug, name: body.name })
      .returning();

    return { tenant };
  },
  {
    body: t.Object({
      slug: t.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
      name: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ["Tenants"],
      summary: "Create a new tenant (superadmin only)",
    },
  }
);

tenantsRoutes.get(
  "/",
  async () => {
    const tenants = await db.select().from(tenantsTable);
    return { tenants };
  },
  {
    detail: {
      tags: ["Tenants"],
      summary: "List all tenants (superadmin only)",
    },
  }
);

tenantsRoutes.get(
  "/:slug",
  async ({ params }) => {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, params.slug))
      .limit(1);

    if (!tenant) {
      throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
    }

    return { tenant };
  },
  {
    detail: {
      tags: ["Tenants"],
      summary: "Get tenant by slug (superadmin only)",
    },
  }
);
