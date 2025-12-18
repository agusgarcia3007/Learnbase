import { sendEmail } from "@/lib/utils";
import { getWelcomeVerificationEmailHtml, getTenantWelcomeEmailHtml } from "@/lib/email-templates";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Job, SendWelcomeEmailJob, CreateStripeCustomerJob, SendTenantWelcomeEmailJob } from "./types";

export async function processJob(job: Job) {
  switch (job.type) {
    case "send-welcome-email":
      return processWelcomeEmail(job.data);
    case "create-stripe-customer":
      return processStripeCustomer(job.data);
    case "send-tenant-welcome-email":
      return processTenantWelcomeEmail(job.data);
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
