import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  paymentsTable,
  paymentItemsTable,
  usersTable,
  coursesTable,
} from "@/db/schema";
import { and, count, desc, eq, sql, or, ilike } from "drizzle-orm";
import {
  parseListParams,
  buildFilterConditions,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type DateFields,
} from "@/lib/filters";
import * as XLSX from "xlsx";

export const revenueRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/earnings", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view earnings", 403);
    }

    const [earningsResult] = await db
      .select({
        grossEarnings: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
        totalFees: sql<number>`COALESCE(SUM(${paymentsTable.platformFee}), 0)`,
        transactionCount: count(),
      })
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.tenantId, ctx.tenant.id),
          eq(paymentsTable.status, "succeeded")
        )
      );

    const monthlyEarnings = await db
      .select({
        month: sql<string>`TO_CHAR(${paymentsTable.paidAt}, 'YYYY-MM')`,
        gross: sql<number>`SUM(${paymentsTable.amount})`,
        fees: sql<number>`SUM(${paymentsTable.platformFee})`,
      })
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.tenantId, ctx.tenant.id),
          eq(paymentsTable.status, "succeeded")
        )
      )
      .groupBy(sql`TO_CHAR(${paymentsTable.paidAt}, 'YYYY-MM')`)
      .orderBy(desc(sql`TO_CHAR(${paymentsTable.paidAt}, 'YYYY-MM')`))
      .limit(12);

    const grossEarnings = Number(earningsResult?.grossEarnings ?? 0);
    const totalFees = Number(earningsResult?.totalFees ?? 0);

    return {
      grossEarnings,
      netEarnings: grossEarnings - totalFees,
      platformFees: totalFees,
      transactionCount: Number(earningsResult?.transactionCount ?? 0),
      monthlyBreakdown: monthlyEarnings.map((m) => ({
        month: m.month,
        gross: Number(m.gross ?? 0),
        net: Number(m.gross ?? 0) - Number(m.fees ?? 0),
        fees: Number(m.fees ?? 0),
      })),
    };
  })
  .get(
    "/payments",
    async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view payments", 403);
      }

      const params = parseListParams(ctx.query);

      const fieldMap: FieldMap<typeof paymentsTable> = {
        status: paymentsTable.status,
        paidAt: paymentsTable.paidAt,
        createdAt: paymentsTable.createdAt,
        amount: paymentsTable.amount,
      };

      const dateFields: DateFields = new Set(["paidAt", "createdAt"]);

      const filterConditions = buildFilterConditions(params.filters, fieldMap, dateFields);
      const tenantFilter = eq(paymentsTable.tenantId, ctx.tenant.id);

      let searchCondition;
      if (params.search) {
        const searchPattern = `%${params.search}%`;
        searchCondition = or(
          ilike(usersTable.name, searchPattern),
          ilike(usersTable.email, searchPattern)
        );
      }

      const whereClause = and(
        tenantFilter,
        ...filterConditions,
        searchCondition
      );

      const sortColumn = getSortColumn(params.sort, fieldMap, { field: "paidAt", order: "desc" });
      const { limit, offset } = getPaginationParams(params.page, params.limit);

      const [paymentsData, [{ total }]] = await Promise.all([
        db
          .select({
            id: paymentsTable.id,
            paidAt: paymentsTable.paidAt,
            createdAt: paymentsTable.createdAt,
            amount: paymentsTable.amount,
            platformFee: paymentsTable.platformFee,
            currency: paymentsTable.currency,
            status: paymentsTable.status,
            userName: usersTable.name,
            userEmail: usersTable.email,
          })
          .from(paymentsTable)
          .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
          .where(whereClause)
          .orderBy(sortColumn ?? desc(paymentsTable.paidAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(paymentsTable)
          .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
          .where(whereClause),
      ]);

      const paymentIds = paymentsData.map((p) => p.id);
      const paymentItems =
        paymentIds.length > 0
          ? await db
              .select({
                paymentId: paymentItemsTable.paymentId,
                courseId: coursesTable.id,
                courseTitle: coursesTable.title,
              })
              .from(paymentItemsTable)
              .leftJoin(coursesTable, eq(paymentItemsTable.courseId, coursesTable.id))
              .where(sql`${paymentItemsTable.paymentId} IN ${paymentIds}`)
          : [];

      const coursesByPayment = paymentItems.reduce(
        (acc, item) => {
          if (!acc[item.paymentId]) {
            acc[item.paymentId] = [];
          }
          if (item.courseId && item.courseTitle) {
            acc[item.paymentId].push({ id: item.courseId, title: item.courseTitle });
          }
          return acc;
        },
        {} as Record<string, { id: string; title: string }[]>
      );

      const payments = paymentsData.map((p) => ({
        id: p.id,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        userName: p.userName ?? "Unknown",
        userEmail: p.userEmail ?? "",
        courses: coursesByPayment[p.id] ?? [],
        amount: p.amount,
        netAmount: p.amount - (p.platformFee ?? 0),
        currency: p.currency,
        status: p.status,
      }));

      return {
        payments,
        pagination: calculatePagination(total, params.page, params.limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        paidAt: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/payments/export",
    async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can export payments", 403);
      }

      const { format, status, paidAt } = ctx.body;

      const conditions = [eq(paymentsTable.tenantId, ctx.tenant.id)];

      if (status) {
        const validStatuses = ["pending", "processing", "succeeded", "failed", "refunded"] as const;
        if (validStatuses.includes(status as typeof validStatuses[number])) {
          conditions.push(eq(paymentsTable.status, status as typeof validStatuses[number]));
        }
      }

      if (paidAt) {
        const [fromStr, toStr] = paidAt.split(",");
        if (fromStr) {
          const fromDate = new Date(fromStr);
          if (!isNaN(fromDate.getTime())) {
            conditions.push(sql`${paymentsTable.paidAt} >= ${fromDate}`);
          }
        }
        if (toStr) {
          const toDate = new Date(toStr);
          toDate.setHours(23, 59, 59, 999);
          if (!isNaN(toDate.getTime())) {
            conditions.push(sql`${paymentsTable.paidAt} <= ${toDate}`);
          }
        }
      }

      const paymentsData = await db
        .select({
          id: paymentsTable.id,
          paidAt: paymentsTable.paidAt,
          amount: paymentsTable.amount,
          platformFee: paymentsTable.platformFee,
          currency: paymentsTable.currency,
          status: paymentsTable.status,
          userName: usersTable.name,
          userEmail: usersTable.email,
        })
        .from(paymentsTable)
        .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
        .where(and(...conditions))
        .orderBy(desc(paymentsTable.paidAt));

      const paymentIds = paymentsData.map((p) => p.id);
      const paymentItems =
        paymentIds.length > 0
          ? await db
              .select({
                paymentId: paymentItemsTable.paymentId,
                courseTitle: coursesTable.title,
              })
              .from(paymentItemsTable)
              .leftJoin(coursesTable, eq(paymentItemsTable.courseId, coursesTable.id))
              .where(sql`${paymentItemsTable.paymentId} IN ${paymentIds}`)
          : [];

      const coursesByPayment = paymentItems.reduce(
        (acc, item) => {
          if (!acc[item.paymentId]) {
            acc[item.paymentId] = [];
          }
          if (item.courseTitle) {
            acc[item.paymentId].push(item.courseTitle);
          }
          return acc;
        },
        {} as Record<string, string[]>
      );

      const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(amount / 100);
      };

      const headers = ["Date", "Customer", "Email", "Course(s)", "Amount", "Net", "Status"];
      const rows = paymentsData.map((p) => [
        p.paidAt?.toISOString().split("T")[0] ?? "",
        p.userName ?? "Unknown",
        p.userEmail ?? "",
        (coursesByPayment[p.id] ?? []).join(", "),
        formatCurrency(p.amount, p.currency),
        formatCurrency(p.amount - (p.platformFee ?? 0), p.currency),
        p.status,
      ]);

      const filename = `payments-${new Date().toISOString().split("T")[0]}`;

      if (format === "xlsx") {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new Response(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
          },
        });
      }

      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    },
    {
      body: t.Object({
        format: t.Union([t.Literal("csv"), t.Literal("xlsx")]),
        status: t.Optional(t.String()),
        paidAt: t.Optional(t.String()),
      }),
    }
  );
