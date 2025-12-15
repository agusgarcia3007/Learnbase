import { Elysia, t } from "elysia";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  pageViewsTable,
  sessionsTable,
  tenantsTable,
} from "@/db/schema";
import { count, eq, sql, and, gte, desc } from "drizzle-orm";

const tenantCache = new Map<string, { id: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function getTenantId(slug: string): Promise<string | null> {
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.id;
  }

  const tenant = await db.query.tenantsTable.findFirst({
    where: eq(tenantsTable.slug, slug),
    columns: { id: true },
  });

  if (tenant) {
    tenantCache.set(slug, { id: tenant.id, expiresAt: Date.now() + CACHE_TTL });
  }

  return tenant?.id ?? null;
}

function processPageView(
  tenantId: string,
  sessionId: string,
  isNewSession: boolean,
  path: string,
  referrer?: string,
  userAgent?: string
): void {
  db.insert(pageViewsTable)
    .values({ tenantId, sessionId, path, referrer, userAgent })
    .catch(() => {});

  if (isNewSession) {
    db.insert(sessionsTable)
      .values({
        id: sessionId,
        tenantId,
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
      .where(eq(sessionsTable.id, sessionId))
      .catch(() => {});
  }
}

export const analyticsRoutes = new Elysia({ name: "analytics" })
  .post(
    "/track",
    (ctx) => {
      const { tenantSlug, sessionId, path, referrer, userAgent } = ctx.body;
      const isNewSession = !sessionId;
      const finalSessionId = sessionId || crypto.randomUUID();

      getTenantId(tenantSlug).then((tenantId) => {
        if (tenantId) {
          processPageView(tenantId, finalSessionId, isNewSession, path, referrer, userAgent);
        }
      });

      return { success: true, sessionId: finalSessionId };
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

        const sessionFilter = and(
          eq(sessionsTable.tenantId, tenantId),
          gte(sessionsTable.startedAt, startDate)
        );
        const pageViewFilter = and(
          eq(pageViewsTable.tenantId, tenantId),
          gte(pageViewsTable.createdAt, startDate)
        );

        const [sessionStats, pageViewStats, dailyVisitors, topPages] =
          await Promise.all([
            db
              .select({
                total: count(),
                bounces: sql<number>`SUM(CASE WHEN ${sessionsTable.isBounce} THEN 1 ELSE 0 END)`,
              })
              .from(sessionsTable)
              .where(sessionFilter),
            db
              .select({ count: count() })
              .from(pageViewsTable)
              .where(pageViewFilter),
            db
              .select({
                date: sql<string>`DATE(${sessionsTable.startedAt})`.as("date"),
                count: count(),
              })
              .from(sessionsTable)
              .where(sessionFilter)
              .groupBy(sql`DATE(${sessionsTable.startedAt})`)
              .orderBy(sql`DATE(${sessionsTable.startedAt})`),
            db
              .select({
                path: pageViewsTable.path,
                views: count(),
              })
              .from(pageViewsTable)
              .where(pageViewFilter)
              .groupBy(pageViewsTable.path)
              .orderBy(desc(count()))
              .limit(5),
          ]);

        const totalSessions = sessionStats[0].total;
        const bounces = Number(sessionStats[0].bounces) || 0;
        const pageViews = pageViewStats[0].count;

        return {
          visitors: {
            total: totalSessions,
            pageViews,
            bounceRate:
              totalSessions > 0
                ? Math.round((bounces / totalSessions) * 100)
                : 0,
            avgPagesPerVisit:
              totalSessions > 0
                ? Math.round((pageViews / totalSessions) * 10) / 10
                : 0,
          },
          dailyVisitors,
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
