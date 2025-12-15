import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  stripe,
  PLAN_CONFIG,
  getPriceIdForPlan,
  isStripeConfigured,
} from "@/lib/stripe";
import { env } from "@/lib/env";
import type { TenantPlan } from "@/db/schema";

export const billingRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/subscription", (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view billing", 403);
      }

      return {
        plan: ctx.tenant.plan,
        subscriptionStatus: ctx.tenant.subscriptionStatus,
        trialEndsAt: ctx.tenant.trialEndsAt?.toISOString() ?? null,
        commissionRate: ctx.tenant.commissionRate,
        stripeCustomerId: ctx.tenant.stripeCustomerId,
        hasSubscription: Boolean(ctx.tenant.stripeSubscriptionId),
      };
    })
  )
  .post(
    "/subscription",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user || !ctx.tenant) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
          throw new AppError(ErrorCode.FORBIDDEN, "Only owners can manage billing", 403);
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
          success_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/settings/billing?success=true`,
          cancel_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/settings/billing?canceled=true`,
          metadata: {
            tenantId: ctx.tenant.id,
            plan,
          },
        });

        return { checkoutUrl: session.url };
      }),
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
  .post("/portal", (ctx) =>
    withHandler(ctx, async () => {
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
        return_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/settings/billing`,
      });

      return { portalUrl: session.url };
    })
  )
  .post("/subscription/cancel", (ctx) =>
    withHandler(ctx, async () => {
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
  )
  .get("/plans", (ctx) =>
    withHandler(ctx, async () => {
      return {
        plans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          monthlyPrice: config.monthlyPrice,
          commissionRate: config.commissionRate,
          storage: config.storage,
          aiGeneration: config.aiGeneration,
        })),
      };
    })
  );
