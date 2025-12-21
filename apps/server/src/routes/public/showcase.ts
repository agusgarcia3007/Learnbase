import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable, usersTable, coursesTable } from "@/db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";
import { getPresignedUrl } from "@/lib/upload";

export const showcaseRoutes = new Elysia({ name: "showcase" }).get(
  "/tenants",
  async () => {
    const usersCountSq = db
      .select({
        tenantId: usersTable.tenantId,
        count: count().as("users_count"),
      })
      .from(usersTable)
      .groupBy(usersTable.tenantId)
      .as("users_count_sq");

    const coursesCountSq = db
      .select({
        tenantId: coursesTable.tenantId,
        count: count().as("courses_count"),
      })
      .from(coursesTable)
      .where(eq(coursesTable.status, "published"))
      .groupBy(coursesTable.tenantId)
      .as("courses_count_sq");

    const tenants = await db
      .select({
        id: tenantsTable.id,
        slug: tenantsTable.slug,
        name: tenantsTable.name,
        logo: tenantsTable.logo,
        description: tenantsTable.description,
        theme: tenantsTable.theme,
        usersCount: sql<number>`coalesce(${usersCountSq.count}, 0)`,
        coursesCount: sql<number>`coalesce(${coursesCountSq.count}, 0)`,
      })
      .from(tenantsTable)
      .leftJoin(usersCountSq, eq(tenantsTable.id, usersCountSq.tenantId))
      .leftJoin(coursesCountSq, eq(tenantsTable.id, coursesCountSq.tenantId))
      .where(
        and(eq(tenantsTable.published, true), eq(tenantsTable.status, "active"))
      )
      .orderBy(desc(tenantsTable.publishedAt))
      .limit(8);

    return {
      tenants: tenants.map((tenant) => ({
        ...tenant,
        logo: tenant.logo ? getPresignedUrl(tenant.logo) : null,
        usersCount: Number(tenant.usersCount),
        coursesCount: Number(tenant.coursesCount),
      })),
    };
  },
  {
    detail: {
      tags: ["Showcase"],
      summary: "List published tenants for showcase",
    },
  }
);
