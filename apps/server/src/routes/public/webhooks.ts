import { Elysia } from "elysia";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import {
  tenantsTable,
  subscriptionHistoryTable,
  paymentsTable,
  paymentItemsTable,
  enrollmentsTable,
  cartItemsTable,
  usersTable,
  coursesTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  stripe,
  getPlanFromPriceId,
  getCommissionRate,
  PLAN_CONFIG,
} from "@/lib/stripe";
import { env } from "@/lib/env";
import { invalidateTenantCache } from "@/plugins/tenant";
import { sendEmail } from "@/lib/utils";
import { SUPERADMIN_EMAIL } from "@/lib/constants";
import {
  getOwnerSaleNotificationEmailHtml,
  getBuyerPurchaseConfirmationEmailHtml,
  getSuperadminCommissionNotificationEmailHtml,
  getSuperadminNewSubscriberEmailHtml,
} from "@/lib/email-templates";
import type Stripe from "stripe";
import type { TenantPlan, SubscriptionStatus, SelectTenant } from "@/db/schema";

function formatCurrency(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}

function getTenantUrl(tenant: SelectTenant): string {
  if (tenant.customDomain) {
    return `https://${tenant.customDomain}`;
  }
  return `https://${tenant.slug}.${
    env.CLIENT_URL?.replace(/^https?:\/\//, "") || "uselearnbase.com"
  }`;
}

async function sendSaleNotificationEmails(params: {
  session: Stripe.Checkout.Session;
  paymentId: string;
  tenantId: string;
  userId: string;
  parsedCourseIds: string[];
}) {
  const { session, paymentId, tenantId, userId, parsedCourseIds } = params;

  const [[tenant], [buyer], [owner], courses, [payment]] = await Promise.all([
    db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)),
    db.select().from(usersTable).where(eq(usersTable.id, userId)),
    db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.tenantId, tenantId), eq(usersTable.role, "owner"))
      ),
    db
      .select({ id: coursesTable.id, title: coursesTable.title })
      .from(coursesTable)
      .where(inArray(coursesTable.id, parsedCourseIds)),
    db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)),
  ]);

  if (!tenant || !buyer || !payment) return;

  const paymentItems = await db
    .select()
    .from(paymentItemsTable)
    .where(eq(paymentItemsTable.paymentId, paymentId));

  const currency = payment.currency.toUpperCase();
  const grossAmount = payment.amount;
  const platformFee = payment.platformFee;
  const netEarnings = grossAmount - platformFee;

  const courseList = courses.map((course) => {
    const item = paymentItems.find((pi) => pi.courseId === course.id);
    return {
      title: course.title,
      price: formatCurrency(item?.priceAtPurchase ?? 0, currency),
    };
  });

  let receiptUrl: string | null = null;
  if (stripe && tenant.stripeConnectAccountId && session.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string,
      { expand: ["latest_charge"] },
      { stripeAccount: tenant.stripeConnectAccountId }
    );
    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    receiptUrl = charge?.receipt_url ?? null;
  }

  const tenantUrl = getTenantUrl(tenant);

  if (owner) {
    sendEmail({
      to: owner.email,
      subject: `New sale on ${tenant.name}`,
      html: getOwnerSaleNotificationEmailHtml({
        ownerName: owner.name,
        tenantName: tenant.name,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        courses: courseList,
        grossAmount: formatCurrency(grossAmount, currency),
        platformFee: formatCurrency(platformFee, currency),
        netEarnings: formatCurrency(netEarnings, currency),
      }),
      senderName: "Learnbase",
    });
  }

  sendEmail({
    to: buyer.email,
    subject: `Your purchase from ${tenant.name}`,
    html: getBuyerPurchaseConfirmationEmailHtml({
      buyerName: buyer.name,
      tenantName: tenant.name,
      courses: courseList,
      totalAmount: formatCurrency(grossAmount, currency),
      receiptUrl,
      dashboardUrl: `${tenantUrl}/my-courses`,
    }),
    senderName: tenant.name,
    replyTo: tenant.contactEmail ?? undefined,
  });

  if (platformFee > 0) {
    sendEmail({
      to: SUPERADMIN_EMAIL,
      subject: `Commission received from ${tenant.name}`,
      html: getSuperadminCommissionNotificationEmailHtml({
        tenantName: tenant.name,
        saleAmount: formatCurrency(grossAmount, currency),
        commissionAmount: formatCurrency(platformFee, currency),
        commissionRate: tenant.commissionRate,
        buyerEmail: buyer.email,
        courseCount: courses.length,
      }),
    });
  }
}

async function sendNewSubscriberNotification(
  tenant: SelectTenant,
  plan: TenantPlan | null
) {
  if (!plan) return;

  const [owner] = await db
    .select()
    .from(usersTable)
    .where(
      and(eq(usersTable.tenantId, tenant.id), eq(usersTable.role, "owner"))
    );

  const planConfig = PLAN_CONFIG[plan];

  sendEmail({
    to: SUPERADMIN_EMAIL,
    subject: `New subscriber: ${tenant.name}`,
    html: getSuperadminNewSubscriberEmailHtml({
      tenantName: tenant.name,
      ownerName: owner?.name ?? "Unknown",
      ownerEmail: owner?.email ?? tenant.billingEmail ?? "Unknown",
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      monthlyPrice: formatCurrency(planConfig.monthlyPrice, "USD"),
    }),
  });
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    logger.error("No tenantId in subscription metadata");
    return;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId));

  if (!tenant) {
    logger.error(`Tenant not found: ${tenantId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const newPlan = priceId ? getPlanFromPriceId(priceId) : null;
  const newStatus = mapStripeStatus(subscription.status);
  const commissionRate = newPlan
    ? getCommissionRate(newPlan)
    : tenant.commissionRate;

  const getTrialEndsAt = () => {
    if (subscription.trial_end) {
      return new Date(subscription.trial_end * 1000);
    }
    if (newStatus === "active") {
      return null;
    }
    return tenant.trialEndsAt;
  };

  await db.transaction(async (tx) => {
    await tx
      .update(tenantsTable)
      .set({
        stripeSubscriptionId: subscription.id,
        plan: newPlan ?? tenant.plan,
        subscriptionStatus: newStatus,
        commissionRate,
        trialEndsAt: getTrialEndsAt(),
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

  if (event.type === "customer.subscription.created") {
    sendNewSubscriberNotification(tenant, newPlan);
  }
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
    logger.error(`Tenant not found for Connect account: ${account.id}`);
    return;
  }

  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  let connectStatus: "not_started" | "pending" | "active" | "restricted" =
    "pending";
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
    logger.error("Missing metadata in checkout session");
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

  sendSaleNotificationEmails({
    session,
    paymentId,
    tenantId,
    userId,
    parsedCourseIds,
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
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
  .post(
    "/stripe",
    async (ctx) => {
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
        event = await stripe.webhooks.constructEventAsync(
          rawBody,
          signature,
          env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        logger.error("Webhook signature verification failed:", { err });
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
        logger.error(`Error handling ${event.type}:`, { err });
      }

      return { received: true };
    },
    {
      parse: "none",
    }
  )
  .post(
    "/connect",
    async (ctx) => {
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
        event = await stripe.webhooks.constructEventAsync(
          rawBody,
          signature,
          env.STRIPE_CONNECT_WEBHOOK_SECRET
        );
      } catch (err) {
        logger.error("Connect webhook signature verification failed:", { err });
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
        logger.error(`Error handling Connect ${event.type}:`, { err });
      }

      return { received: true };
    },
    {
      parse: "none",
    }
  );
