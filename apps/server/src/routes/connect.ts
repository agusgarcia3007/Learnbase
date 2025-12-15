import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin, invalidateTenantCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { env } from "@/lib/env";

export const connectRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .get("/status", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can view Connect status", 403);
      }

      if (
        ctx.tenant.stripeConnectAccountId &&
        ctx.tenant.stripeConnectStatus === "pending" &&
        stripe &&
        isStripeConfigured()
      ) {
        const account = await stripe.accounts.retrieve(ctx.tenant.stripeConnectAccountId);

        const chargesEnabled = account.charges_enabled ?? false;
        const payoutsEnabled = account.payouts_enabled ?? false;

        let connectStatus: "pending" | "active" | "restricted" = "pending";
        if (chargesEnabled && payoutsEnabled) {
          connectStatus = "active";
        } else if (account.requirements?.disabled_reason) {
          connectStatus = "restricted";
        }

        if (
          connectStatus !== ctx.tenant.stripeConnectStatus ||
          chargesEnabled !== ctx.tenant.chargesEnabled ||
          payoutsEnabled !== ctx.tenant.payoutsEnabled
        ) {
          await db
            .update(tenantsTable)
            .set({ chargesEnabled, payoutsEnabled, stripeConnectStatus: connectStatus })
            .where(eq(tenantsTable.id, ctx.tenant.id));

          invalidateTenantCache(ctx.tenant.slug);

          return {
            status: connectStatus,
            chargesEnabled,
            payoutsEnabled,
            accountId: ctx.tenant.stripeConnectAccountId,
          };
        }
      }

      return {
        status: ctx.tenant.stripeConnectStatus,
        chargesEnabled: ctx.tenant.chargesEnabled ?? false,
        payoutsEnabled: ctx.tenant.payoutsEnabled ?? false,
        accountId: ctx.tenant.stripeConnectAccountId,
      };
    }
  )
  .post("/onboard", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can setup Connect", 403);
      }

      if (!stripe || !isStripeConfigured()) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
      }

      let accountId = ctx.tenant.stripeConnectAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
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

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/connect?refresh=true`,
        return_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/connect?success=true`,
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due",
        },
      });

      return { onboardingUrl: accountLink.url };
    }
  )
  .post("/refresh", async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.user.role !== "owner" && ctx.user.role !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Only owners can refresh Connect link", 403);
      }

      if (!stripe || !isStripeConfigured()) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
      }

      if (!ctx.tenant.stripeConnectAccountId) {
        throw new AppError(ErrorCode.BAD_REQUEST, "No Connect account found", 400);
      }

      const accountLink = await stripe.accountLinks.create({
        account: ctx.tenant.stripeConnectAccountId,
        refresh_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/connect?refresh=true`,
        return_url: `${env.CLIENT_URL}/${ctx.tenant.slug}/connect?success=true`,
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due",
        },
      });

      return { onboardingUrl: accountLink.url };
    }
  )
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
        throw new AppError(ErrorCode.BAD_REQUEST, "No Connect account found", 400);
      }

      const loginLink = await stripe.accounts.createLoginLink(
        ctx.tenant.stripeConnectAccountId
      );

      return { dashboardUrl: loginLink.url };
    }
  );
