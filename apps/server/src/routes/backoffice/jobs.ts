import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { jobsHistoryTable } from "@/db/schema";
import { count, eq, and, or, lte, sql } from "drizzle-orm";
import {
  parseListParams,
  buildWhereClause,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type DateFields,
} from "@/lib/filters";

const fieldMap: FieldMap<typeof jobsHistoryTable> = {
  id: jobsHistoryTable.id,
  jobType: jobsHistoryTable.jobType,
  status: jobsHistoryTable.status,
  createdAt: jobsHistoryTable.createdAt,
  startedAt: jobsHistoryTable.startedAt,
  completedAt: jobsHistoryTable.completedAt,
};

const dateFields: DateFields = new Set(["createdAt", "startedAt", "completedAt"]);

function requireSuperadmin(ctx: { user: unknown; userRole: string | null }) {
  if (!ctx.user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }
  if (ctx.userRole !== "superadmin") {
    throw new AppError(
      ErrorCode.SUPERADMIN_REQUIRED,
      "Superadmin access required",
      403
    );
  }
}

export const jobsRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    async (ctx) => {
      requireSuperadmin(ctx);

      const params = parseListParams(ctx.query);

      const tab = ctx.query.tab;
      let statusFilter;
      if (tab === "pending") {
        statusFilter = or(
          eq(jobsHistoryTable.status, "pending"),
          eq(jobsHistoryTable.status, "processing")
        );
      } else if (tab === "executed") {
        statusFilter = or(
          eq(jobsHistoryTable.status, "completed"),
          eq(jobsHistoryTable.status, "failed")
        );
      }

      const baseWhereClause = buildWhereClause(params, fieldMap, [], dateFields);
      const whereClause = statusFilter
        ? baseWhereClause
          ? and(baseWhereClause, statusFilter)
          : statusFilter
        : baseWhereClause;

      const sortColumn = getSortColumn(params.sort, fieldMap, {
        field: "createdAt",
        order: "desc",
      });
      const { limit, offset } = getPaginationParams(params.page, params.limit);

      const baseQuery = db.select().from(jobsHistoryTable);

      let query = baseQuery.$dynamic();
      if (whereClause) {
        query = query.where(whereClause);
      }
      if (sortColumn) {
        query = query.orderBy(sortColumn);
      }
      query = query.limit(limit).offset(offset);

      const countQuery = db.select({ count: count() }).from(jobsHistoryTable);
      let countQueryDynamic = countQuery.$dynamic();
      if (whereClause) {
        countQueryDynamic = countQueryDynamic.where(whereClause);
      }

      const [jobs, [{ count: total }]] = await Promise.all([query, countQueryDynamic]);

      const jobsWithDuration = jobs.map((job) => ({
        ...job,
        durationMs:
          job.startedAt && job.completedAt
            ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
            : null,
      }));

      return {
        jobs: jobsWithDuration,
        pagination: calculatePagination(total, params.page, params.limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        tab: t.Optional(t.Union([t.Literal("pending"), t.Literal("executed")])),
        status: t.Optional(t.String()),
        jobType: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Jobs"],
        summary: "List job history (superadmin only)",
      },
    }
  )
  .get(
    "/stats",
    async (ctx) => {
      requireSuperadmin(ctx);

      const [
        totalResult,
        pendingResult,
        processingResult,
        completedResult,
        failedResult,
        avgDurationResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(jobsHistoryTable),
        db
          .select({ count: count() })
          .from(jobsHistoryTable)
          .where(eq(jobsHistoryTable.status, "pending")),
        db
          .select({ count: count() })
          .from(jobsHistoryTable)
          .where(eq(jobsHistoryTable.status, "processing")),
        db
          .select({ count: count() })
          .from(jobsHistoryTable)
          .where(eq(jobsHistoryTable.status, "completed")),
        db
          .select({ count: count() })
          .from(jobsHistoryTable)
          .where(eq(jobsHistoryTable.status, "failed")),
        db
          .select({
            avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobsHistoryTable.completedAt} - ${jobsHistoryTable.startedAt})) * 1000)`,
          })
          .from(jobsHistoryTable)
          .where(
            and(
              eq(jobsHistoryTable.status, "completed"),
              sql`${jobsHistoryTable.startedAt} IS NOT NULL`,
              sql`${jobsHistoryTable.completedAt} IS NOT NULL`
            )
          ),
      ]);

      return {
        stats: {
          total: totalResult[0].count,
          pending: pendingResult[0].count,
          processing: processingResult[0].count,
          completed: completedResult[0].count,
          failed: failedResult[0].count,
          avgDurationMs: Math.round(avgDurationResult[0].avgDuration ?? 0),
        },
      };
    },
    {
      detail: {
        tags: ["Jobs"],
        summary: "Get job statistics (superadmin only)",
      },
    }
  )
  .delete(
    "/cleanup",
    async (ctx) => {
      requireSuperadmin(ctx);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await db
        .delete(jobsHistoryTable)
        .where(lte(jobsHistoryTable.createdAt, thirtyDaysAgo))
        .returning({ id: jobsHistoryTable.id });

      return { deletedCount: result.length };
    },
    {
      detail: {
        tags: ["Jobs"],
        summary: "Delete jobs older than 30 days (superadmin only)",
      },
    }
  );
