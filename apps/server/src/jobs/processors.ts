import { sendEmail } from "@/lib/utils";
import {
  getWelcomeVerificationEmailHtml,
  getTenantWelcomeEmailHtml,
  getFeatureSubmissionEmailHtml,
  getFeatureApprovedEmailHtml,
  getFeatureRejectedEmailHtml,
} from "@/lib/email-templates";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/db";
import { tenantsTable, tenantCustomersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  Job,
  SendWelcomeEmailJob,
  CreateStripeCustomerJob,
  SendTenantWelcomeEmailJob,
  CreateConnectedCustomerJob,
  SyncConnectedCustomerJob,
  SendFeatureSubmissionEmailJob,
  SendFeatureApprovedEmailJob,
  SendFeatureRejectedEmailJob,
} from "./types";

export async function processJob(job: Job) {
  switch (job.type) {
    case "send-welcome-email":
      return processWelcomeEmail(job.data);
    case "create-stripe-customer":
      return processStripeCustomer(job.data);
    case "send-tenant-welcome-email":
      return processTenantWelcomeEmail(job.data);
    case "create-connected-customer":
      return processCreateConnectedCustomer(job.data);
    case "sync-connected-customer":
      return processSyncConnectedCustomer(job.data);
    case "send-feature-submission-email":
      return processFeatureSubmissionEmail(job.data);
    case "send-feature-approved-email":
      return processFeatureApprovedEmail(job.data);
    case "send-feature-rejected-email":
      return processFeatureRejectedEmail(job.data);
  }
}

async function processWelcomeEmail(data: SendWelcomeEmailJob["data"]) {
  const verificationUrl = `${data.clientUrl}/verify-email?token=${data.verificationToken}`;
  await sendEmail({
    to: data.email,
    subject: "Welcome! Please verify your email",
    html: getWelcomeVerificationEmailHtml({
      userName: data.userName,
      verificationUrl,
    }),
  });
}

async function processStripeCustomer(data: CreateStripeCustomerJob["data"]) {
  if (!stripe || !isStripeConfigured()) return;

  const customer = await stripe.customers.create({
    email: data.email,
    name: data.name,
    metadata: { tenantId: data.tenantId, slug: data.slug },
  });

  await db
    .update(tenantsTable)
    .set({
      stripeCustomerId: customer.id,
      plan: "starter",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .where(eq(tenantsTable.id, data.tenantId));
}

async function processTenantWelcomeEmail(data: SendTenantWelcomeEmailJob["data"]) {
  await sendEmail({
    to: data.email,
    subject: `Welcome to ${data.tenantName}!`,
    html: getTenantWelcomeEmailHtml({
      userName: data.userName,
      tenantName: data.tenantName,
      dashboardUrl: data.dashboardUrl,
      logoUrl: data.logoUrl,
    }),
  });
}

async function processCreateConnectedCustomer(data: CreateConnectedCustomerJob["data"]) {
  if (!stripe || !isStripeConfigured()) return;

  const [existing] = await db
    .select()
    .from(tenantCustomersTable)
    .where(
      and(
        eq(tenantCustomersTable.tenantId, data.tenantId),
        eq(tenantCustomersTable.userId, data.userId)
      )
    )
    .limit(1);

  if (existing) return;

  const customer = await stripe.customers.create(
    {
      email: data.email,
      name: data.name,
      metadata: { userId: data.userId, platform: "learnbase" },
    },
    { stripeAccount: data.stripeConnectAccountId }
  );

  await db.insert(tenantCustomersTable).values({
    tenantId: data.tenantId,
    userId: data.userId,
    stripeCustomerId: customer.id,
  });
}

async function processSyncConnectedCustomer(data: SyncConnectedCustomerJob["data"]) {
  if (!stripe || !isStripeConfigured()) return;

  const tenantCustomers = await db
    .select({
      stripeCustomerId: tenantCustomersTable.stripeCustomerId,
      stripeConnectAccountId: tenantsTable.stripeConnectAccountId,
    })
    .from(tenantCustomersTable)
    .innerJoin(tenantsTable, eq(tenantCustomersTable.tenantId, tenantsTable.id))
    .where(eq(tenantCustomersTable.userId, data.userId));

  await Promise.all(
    tenantCustomers
      .filter((tc) => tc.stripeConnectAccountId)
      .map((tc) =>
        stripe!.customers.update(
          tc.stripeCustomerId,
          { email: data.email, name: data.name },
          { stripeAccount: tc.stripeConnectAccountId! }
        )
      )
  );
}

async function processFeatureSubmissionEmail(data: SendFeatureSubmissionEmailJob["data"]) {
  await sendEmail({
    to: data.email,
    subject: "Thanks for your feature suggestion!",
    html: getFeatureSubmissionEmailHtml({
      userName: data.userName,
      featureTitle: data.featureTitle,
    }),
  });
}

async function processFeatureApprovedEmail(data: SendFeatureApprovedEmailJob["data"]) {
  await sendEmail({
    to: data.email,
    subject: "We're shipping your feature!",
    html: getFeatureApprovedEmailHtml({
      userName: data.userName,
      featureTitle: data.featureTitle,
      featuresUrl: data.featuresUrl,
    }),
  });
}

async function processFeatureRejectedEmail(data: SendFeatureRejectedEmailJob["data"]) {
  await sendEmail({
    to: data.email,
    subject: "Update on your feature suggestion",
    html: getFeatureRejectedEmailHtml({
      userName: data.userName,
      featureTitle: data.featureTitle,
      rejectionReason: data.rejectionReason,
    }),
  });
}
