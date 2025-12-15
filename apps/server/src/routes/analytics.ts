import { Elysia, t } from "elysia";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  pageViewsTable,
  sessionsTable,
  tenantsTable,
} from "@/db/schema";
import { count, eq, sql, and, gte, desc } from "drizzle-orm";

async function processPageView(
  tenantSlug: string,
  sessionId: string | undefined,
  path: string,
  referrer?: string,
  userAgent?: string
): Promise<string | null> {
  try {
    const tenant = await db.query.tenantsTable.findFirst({
      where: eq(tenantsTable.slug, tenantSlug),
      columns: { id: true },
    });

    if (!tenant) return null;

    const newSessionId = sessionId || crypto.randomUUID();
    const isNewSession = !sessionId;

    db.insert(pageViewsTable)
      .values({
        tenantId: tenant.id,
        sessionId: newSessionId,
        path,
        referrer,
        userAgent,
      })
      .catch(() => {});

    if (isNewSession) {
      db.insert(sessionsTable)
        .values({
          id: newSessionId,
          tenantId: tenant.id,
          entryPath: path,
          exitPath: path,
          referrer,
          userAgent,
          isBounce: true,
        })
        .catch(() => {});
    } else {
      db.update(sessionsTable)
        .set({
          lastActivityAt: new Date(),
          exitPath: path,
          pageViews: sql`${sessionsTable.pageViews} + 1`,
          isBounce: false,
        })
        .where(eq(sessionsTable.id, newSessionId))
        .catch(() => {});
    }

    return newSessionId;
  } catch {
    return sessionId || null;
  }
}

export const analyticsRoutes = new Elysia({ name: "analytics" })
  .post(
    "/track",
    (ctx) => {
      const { tenantSlug, sessionId, path, referrer, userAgent } = ctx.body;
      const newSessionId = sessionId || crypto.randomUUID();

      processPageView(tenantSlug, sessionId, path, referrer, userAgent);

      return { success: true, sessionId: newSessionId };
    },
    {
      body: t.Object({
        tenantSlug: t.String(),
        sessionId: t.Optional(t.String()),
        path: t.String(),
        referrer: t.Optional(t.String()),
        userAgent: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Analytics"],
        summary: "Track page view",
      },
    }
  )
  .get(
    "/tenants/:tenantId/visitors",
    (ctx) =>
      withHandler(ctx, async () => {
        const { tenantId } = ctx.params;
        const period = (ctx.query.period as string) || "30d";

        const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
          totalVisitors,
          totalPageViews,
          bounceStats,
          dailyVisitors,
          topPages,
        ] = await Promise.all([
          db
            .select({ count: sql<number>`COUNT(DISTINCT ${sessionsTable.id})` })
            .from(sessionsTable)
            .where(
              and(
                eq(sessionsTable.tenantId, tenantId),
                gte(sessionsTable.startedAt, startDate)
              )
            ),
          db
            .select({ count: count() })
            .from(pageViewsTable)
            .where(
              and(
                eq(pageViewsTable.tenantId, tenantId),
                gte(pageViewsTable.createdAt, startDate)
              )
            ),
          db
            .select({
              total: count(),
              bounces: sql<number>`COUNT(CASE WHEN ${sessionsTable.isBounce} = true THEN 1 END)`,
            })
            .from(sessionsTable)
            .where(
              and(
                eq(sessionsTable.tenantId, tenantId),
                gte(sessionsTable.startedAt, startDate)
              )
            ),
          db
            .select({
              date: sql<string>`DATE(${sessionsTable.startedAt})`.as("date"),
              visitors: sql<number>`COUNT(DISTINCT ${sessionsTable.id})`,
            })
            .from(sessionsTable)
            .where(
              and(
                eq(sessionsTable.tenantId, tenantId),
                gte(sessionsTable.startedAt, startDate)
              )
            )
            .groupBy(sql`DATE(${sessionsTable.startedAt})`)
            .orderBy(sql`DATE(${sessionsTable.startedAt})`),
          db
            .select({
              path: pageViewsTable.path,
              views: count(),
            })
            .from(pageViewsTable)
            .where(
              and(
                eq(pageViewsTable.tenantId, tenantId),
                gte(pageViewsTable.createdAt, startDate)
              )
            )
            .groupBy(pageViewsTable.path)
            .orderBy(desc(count()))
            .limit(5),
        ]);

        const totalSessions = bounceStats[0].total;
        const bounces = Number(bounceStats[0].bounces);
        const bounceRate =
          totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

        return {
          visitors: {
            total: Number(totalVisitors[0].count),
            pageViews: totalPageViews[0].count,
            bounceRate,
            avgPagesPerVisit:
              totalSessions > 0
                ? Math.round(
                    (totalPageViews[0].count / totalSessions) * 10
                  ) / 10
                : 0,
          },
          dailyVisitors: dailyVisitors.map((d) => ({
            date: d.date,
            count: Number(d.visitors),
          })),
          topPages,
        };
      }),
    {
      params: t.Object({
        tenantId: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        period: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Analytics"],
        summary: "Get visitor analytics for a tenant",
      },
    }
  );
