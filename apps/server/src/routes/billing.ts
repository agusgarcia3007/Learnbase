import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin, invalidateTenantCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  tenantsTable,
  documentsTable,
  videosTable,
  paymentsTable,
  paymentItemsTable,
  usersTable,
  coursesTable,
} from "@/db/schema";
import { and, count, desc, eq, sql, or, ilike } from "drizzle-orm";
import {
  stripe,
  PLAN_CONFIG,
  getPriceIdForPlan,
  isStripeConfigured,
} from "@/lib/stripe";
import { getTenantClientUrl } from "@/lib/utils";
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

export const billingRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/subscription", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view billing", 403);
      }

      const [[documentsStorage], [videosStorage]] = await Promise.all([
        db
          .select({
            usedBytes: sql<string>`coalesce(sum(${documentsTable.fileSize}), 0)`,
          })
          .from(documentsTable)
          .where(eq(documentsTable.tenantId, ctx.tenant.id)),
        db
          .select({
            usedBytes: sql<string>`coalesce(sum(${videosTable.fileSizeBytes}), 0)`,
          })
          .from(videosTable)
          .where(eq(videosTable.tenantId, ctx.tenant.id)),
      ]);

      const storageResult = {
        usedBytes: String(
          Number(documentsStorage?.usedBytes ?? 0) + Number(videosStorage?.usedBytes ?? 0)
        ),
      };

      const storageUsedBytes = Number(storageResult?.usedBytes ?? 0);
      const storageLimitBytes = ctx.tenant.plan
        ? PLAN_CONFIG[ctx.tenant.plan].storageGb * 1024 * 1024 * 1024
        : 0;

      return {
        plan: ctx.tenant.plan,
        subscriptionStatus: ctx.tenant.subscriptionStatus,
        trialEndsAt: ctx.tenant.trialEndsAt?.toISOString() ?? null,
        commissionRate: ctx.tenant.commissionRate,
        stripeCustomerId: ctx.tenant.stripeCustomerId,
        hasSubscription: Boolean(ctx.tenant.stripeSubscriptionId),
        storageUsedBytes,
        storageLimitBytes,
      };
    }
  )
  .post(
    "/subscription",
    async (ctx) => {
        if (!ctx.user || !ctx.tenant) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
          throw new AppError(ErrorCode.FORBIDDEN, "Only owners can manage billing", 403);
        }

        if (
          ctx.tenant.stripeSubscriptionId &&
          ctx.tenant.subscriptionStatus &&
          ["active", "trialing"].includes(ctx.tenant.subscriptionStatus)
        ) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "You already have an active subscription",
            400
          );
        }

        if (!stripe || !isStripeConfigured()) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
        }

        const { plan } = ctx.body;
        const priceId = getPriceIdForPlan(plan);

        if (!priceId) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Invalid plan", 400);
        }

        let customerId = ctx.tenant.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.tenant.billingEmail ?? ctx.user.email,
            name: ctx.tenant.name,
            metadata: {
              tenantId: ctx.tenant.id,
              tenantSlug: ctx.tenant.slug,
            },
          });
          customerId = customer.id;

          await db
            .update(tenantsTable)
            .set({
              stripeCustomerId: customerId,
              billingEmail: ctx.tenant.billingEmail ?? ctx.user.email,
            })
            .where(eq(tenantsTable.id, ctx.tenant.id));

          invalidateTenantCache(ctx.tenant.slug);
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: 7,
            metadata: {
              tenantId: ctx.tenant.id,
              plan,
            },
          },
          success_url: `${getTenantClientUrl(ctx.tenant)}/billing?success=true`,
          cancel_url: `${getTenantClientUrl(ctx.tenant)}/billing?canceled=true`,
          metadata: {
            tenantId: ctx.tenant.id,
            plan,
          },
        });

        return { checkoutUrl: session.url };
      },
    {
      body: t.Object({
        plan: t.Union([
          t.Literal("starter"),
          t.Literal("growth"),
          t.Literal("scale"),
        ]),
      }),
    }
  )
  .post("/portal", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can access billing portal", 403);
      }

      if (!stripe || !isStripeConfigured()) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
      }

      if (!ctx.tenant.stripeCustomerId) {
        throw new AppError(ErrorCode.BAD_REQUEST, "No billing account found", 400);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: ctx.tenant.stripeCustomerId,
        return_url: `${getTenantClientUrl(ctx.tenant)}/settings/billing`,
      });

      return { portalUrl: session.url };
    }
  )
  .post("/subscription/cancel", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can cancel subscription", 403);
      }

      if (!stripe || !isStripeConfigured()) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
      }

      if (!ctx.tenant.stripeSubscriptionId) {
        throw new AppError(ErrorCode.BAD_REQUEST, "No active subscription", 400);
      }

      await stripe.subscriptions.update(ctx.tenant.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true };
    }
  )
  .get("/plans", async () => {
      return {
        plans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          monthlyPrice: config.monthlyPrice,
          commissionRate: config.commissionRate,
          storageGb: config.storageGb,
          aiGeneration: config.aiGeneration,
          maxStudents: config.maxStudents,
          maxCourses: config.maxCourses,
          customDomain: config.customDomain,
          certificates: config.certificates,
          analytics: config.analytics,
          prioritySupport: config.prioritySupport,
          whiteLabel: config.whiteLabel,
        })),
      };
    }
  )
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
