import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin, invalidateTenantCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getTenantClientUrl } from "@/lib/utils";

export const payoutsRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/status", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view payout status", 403);
    }

    return {
      status: ctx.tenant.stripeConnectStatus,
      chargesEnabled: ctx.tenant.chargesEnabled ?? false,
      payoutsEnabled: ctx.tenant.payoutsEnabled ?? false,
      accountId: ctx.tenant.stripeConnectAccountId,
    };
  })
  .post("/onboard", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can setup payouts", 403);
    }

    if (!stripe || !isStripeConfigured()) {
      throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
    }

    let accountId = ctx.tenant.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        email: ctx.tenant.billingEmail ?? ctx.user.email,
        metadata: {
          tenantId: ctx.tenant.id,
          tenantSlug: ctx.tenant.slug,
        },
        business_profile: {
          name: ctx.tenant.name,
          url: ctx.tenant.customDomain
            ? `https://${ctx.tenant.customDomain}`
            : `https://${ctx.tenant.slug}.${env.BASE_DOMAIN}`,
        },
      });
      accountId = account.id;

      await db
        .update(tenantsTable)
        .set({
          stripeConnectAccountId: accountId,
          stripeConnectStatus: "pending",
        })
        .where(eq(tenantsTable.id, ctx.tenant.id));

      invalidateTenantCache(ctx.tenant.slug);
    }

    const tenantUrl = getTenantClientUrl(ctx.tenant);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${tenantUrl}/finance/payouts?refresh=true`,
      return_url: `${tenantUrl}/finance/payouts?success=true`,
      type: "account_onboarding",
      collection_options: {
        fields: "eventually_due",
      },
    });

    return { onboardingUrl: accountLink.url };
  })
  .post("/refresh", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can refresh payout link", 403);
    }

    if (!stripe || !isStripeConfigured()) {
      throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
    }

    if (!ctx.tenant.stripeConnectAccountId) {
      throw new AppError(ErrorCode.BAD_REQUEST, "No payout account found", 400);
    }

    const tenantUrl = getTenantClientUrl(ctx.tenant);
    const accountLink = await stripe.accountLinks.create({
      account: ctx.tenant.stripeConnectAccountId,
      refresh_url: `${tenantUrl}/finance/payouts?refresh=true`,
      return_url: `${tenantUrl}/finance/payouts?success=true`,
      type: "account_onboarding",
      collection_options: {
        fields: "eventually_due",
      },
    });

    return { onboardingUrl: accountLink.url };
  })
  .get("/dashboard", async (ctx) => {
    if (!ctx.user || !ctx.tenant) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only owners can access dashboard", 403);
    }

    if (!stripe || !isStripeConfigured()) {
      throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
    }

    if (!ctx.tenant.stripeConnectAccountId) {
      throw new AppError(ErrorCode.BAD_REQUEST, "No payout account found", 400);
    }

    const loginLink = await stripe.accounts.createLoginLink(
      ctx.tenant.stripeConnectAccountId
    );

    return { dashboardUrl: loginLink.url };
  });
