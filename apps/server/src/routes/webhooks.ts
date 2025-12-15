import { Elysia } from "elysia";
import { db } from "@/db";
import {
  tenantsTable,
  subscriptionHistoryTable,
  paymentsTable,
  paymentItemsTable,
  enrollmentsTable,
  cartItemsTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { stripe, getPlanFromPriceId, getCommissionRate } from "@/lib/stripe";
import { env } from "@/lib/env";
import { invalidateTenantCache } from "@/plugins/tenant";
import type Stripe from "stripe";
import type { TenantPlan, SubscriptionStatus } from "@/db/schema";

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    console.error("No tenantId in subscription metadata");
    return;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId));

  if (!tenant) {
    console.error(`Tenant not found: ${tenantId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const newPlan = priceId ? getPlanFromPriceId(priceId) : null;
  const newStatus = mapStripeStatus(subscription.status);
  const commissionRate = newPlan ? getCommissionRate(newPlan) : tenant.commissionRate;

  await db.transaction(async (tx) => {
    await tx
      .update(tenantsTable)
      .set({
        stripeSubscriptionId: subscription.id,
        plan: newPlan ?? tenant.plan,
        subscriptionStatus: newStatus,
        commissionRate,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      })
      .where(eq(tenantsTable.id, tenantId));

    await tx.insert(subscriptionHistoryTable).values({
      tenantId,
      stripeSubscriptionId: subscription.id,
      stripeEventId: event.id,
      previousPlan: tenant.plan,
      newPlan: newPlan ?? tenant.plan,
      previousStatus: tenant.subscriptionStatus,
      newStatus,
      eventType: event.type,
      eventData: subscription as unknown as Record<string, unknown>,
    });
  });

  invalidateTenantCache(tenant.slug);
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) return;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId));

  if (!tenant) return;

  await db.transaction(async (tx) => {
    await tx
      .update(tenantsTable)
      .set({
        subscriptionStatus: "canceled",
      })
      .where(eq(tenantsTable.id, tenantId));

    await tx.insert(subscriptionHistoryTable).values({
      tenantId,
      stripeSubscriptionId: subscription.id,
      stripeEventId: event.id,
      previousPlan: tenant.plan,
      newPlan: tenant.plan,
      previousStatus: tenant.subscriptionStatus,
      newStatus: "canceled",
      eventType: event.type,
      eventData: subscription as unknown as Record<string, unknown>,
    });
  });

  invalidateTenantCache(tenant.slug);
}

async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.stripeConnectAccountId, account.id));

  if (!tenant) {
    console.error(`Tenant not found for Connect account: ${account.id}`);
    return;
  }

  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  let connectStatus: "not_started" | "pending" | "active" | "restricted" = "pending";
  if (chargesEnabled && payoutsEnabled) {
    connectStatus = "active";
  } else if (account.requirements?.disabled_reason) {
    connectStatus = "restricted";
  }

  await db
    .update(tenantsTable)
    .set({
      chargesEnabled,
      payoutsEnabled,
      stripeConnectStatus: connectStatus,
    })
    .where(eq(tenantsTable.id, tenant.id));

  invalidateTenantCache(tenant.slug);
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { paymentId, tenantId, userId, courseIds } = session.metadata ?? {};

  if (!paymentId || !tenantId || !userId || !courseIds) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const parsedCourseIds = JSON.parse(courseIds) as string[];

  await db.transaction(async (tx) => {
    await tx
      .update(paymentsTable)
      .set({
        status: "succeeded",
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
      })
      .where(eq(paymentsTable.id, paymentId));

    const paymentItems = await tx
      .select()
      .from(paymentItemsTable)
      .where(eq(paymentItemsTable.paymentId, paymentId));

    const enrollmentValues = paymentItems.map((item) => ({
      userId,
      courseId: item.courseId,
      tenantId,
      paymentId,
      purchasePrice: item.priceAtPurchase,
      purchaseCurrency: item.currencyAtPurchase,
    }));

    if (enrollmentValues.length > 0) {
      await tx
        .insert(enrollmentsTable)
        .values(enrollmentValues)
        .onConflictDoNothing();
    }

    await tx
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.userId, userId),
          inArray(cartItemsTable.courseId, parsedCourseIds)
        )
      );
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    incomplete: "unpaid",
    incomplete_expired: "canceled",
    paused: "past_due",
  };
  return statusMap[status] ?? "active";
}

export const webhooksRoutes = new Elysia()
  .post("/stripe", async (ctx) => {
    if (!stripe) {
      return { received: false, error: "Stripe not configured" };
    }

    const signature = ctx.headers["stripe-signature"];
    if (!signature) {
      ctx.set.status = 400;
      return { error: "Missing stripe-signature header" };
    }

    const rawBody = await ctx.request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      ctx.set.status = 400;
      return { error: "Invalid signature" };
    }

    const existing = await db
      .select({ id: subscriptionHistoryTable.id })
      .from(subscriptionHistoryTable)
      .where(eq(subscriptionHistoryTable.stripeEventId, event.id))
      .limit(1);

    if (existing.length > 0) {
      return { received: true, duplicate: true };
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionEvent(event);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event);
          break;
      }
    } catch (err) {
      console.error(`Error handling ${event.type}:`, err);
    }

    return { received: true };
  }, {
    parse: "none",
  })
  .post("/connect", async (ctx) => {
    if (!stripe) {
      return { received: false, error: "Stripe not configured" };
    }

    const signature = ctx.headers["stripe-signature"];
    if (!signature) {
      ctx.set.status = 400;
      return { error: "Missing stripe-signature header" };
    }

    const rawBody = await ctx.request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_CONNECT_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Connect webhook signature verification failed:", err);
      ctx.set.status = 400;
      return { error: "Invalid signature" };
    }

    try {
      switch (event.type) {
        case "account.updated":
          await handleAccountUpdated(event);
          break;
        case "checkout.session.completed":
          await handleCheckoutCompleted(event);
          break;
      }
    } catch (err) {
      console.error(`Error handling Connect ${event.type}:`, err);
    }

    return { received: true };
  }, {
    parse: "none",
  });
