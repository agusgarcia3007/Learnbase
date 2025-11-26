import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const tenantsRoutes = new Elysia({
  prefix: "/tenants",
  name: "tenants-routes",
})
  .use(authPlugin)
  .onBeforeHandle(({ user, userRole, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
    if (userRole !== "superadmin") {
      set.status = 403;
      return { message: "Superadmin access required" };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      const [existing] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.slug, body.slug))
        .limit(1);

      if (existing) {
        set.status = 409;
        return { message: "Tenant slug already exists" };
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
  )
  .get(
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
  )
  .get(
    "/:slug",
    async ({ params, set }) => {
      const [tenant] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.slug, params.slug))
        .limit(1);

      if (!tenant) {
        set.status = 404;
        return { message: "Tenant not found" };
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
