import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin, invalidateTenantCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { tenantsTable, documentsTable, videosTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  stripe,
  PLAN_CONFIG,
  getPriceIdForPlan,
  isStripeConfigured,
} from "@/lib/stripe";
import { CLIENT_URL } from "@/lib/constants";

export const subscriptionRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view subscription", 403);
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
  })
  .post(
    "/",
    async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can manage subscription", 403);
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
        success_url: `${CLIENT_URL}/${ctx.tenant.slug}?success=true`,
        cancel_url: `${CLIENT_URL}/${ctx.tenant.slug}/finance/subscription?canceled=true`,
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
      return_url: `${CLIENT_URL}/${ctx.tenant.slug}/finance/subscription`,
    });

    return { portalUrl: session.url };
  })
  .post("/cancel", async (ctx) => {
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
  })
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
  });
