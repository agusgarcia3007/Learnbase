import Stripe from "stripe";
import { env } from "./env";
import type { TenantPlan } from "@/db/schema";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

export const PLAN_CONFIG = {
  starter: {
    priceId: env.STRIPE_STARTER_PRICE_ID,
    commissionRate: 5,
    monthlyPrice: 4900,
    storageGb: 15,
    aiGeneration: "standard",
    maxStudents: null,
    maxCourses: null,
    customDomain: true,
    certificates: true,
    analytics: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  growth: {
    priceId: env.STRIPE_GROWTH_PRICE_ID,
    commissionRate: 2,
    monthlyPrice: 9900,
    storageGb: 100,
    aiGeneration: "unlimited",
    maxStudents: null,
    maxCourses: null,
    customDomain: true,
    certificates: true,
    analytics: true,
    prioritySupport: false,
    whiteLabel: false,
  },
  scale: {
    priceId: env.STRIPE_SCALE_PRICE_ID,
    commissionRate: 0,
    monthlyPrice: 34900,
    storageGb: 2048,
    aiGeneration: "unlimited",
    maxStudents: null,
    maxCourses: null,
    customDomain: true,
    certificates: true,
    analytics: true,
    prioritySupport: true,
    whiteLabel: true,
  },
} as const;

export function getPriceIdForPlan(plan: TenantPlan): string {
  return PLAN_CONFIG[plan].priceId;
}

export function getCommissionRate(plan: TenantPlan): number {
  return PLAN_CONFIG[plan].commissionRate;
}

export function calculatePlatformFee(amount: number, commissionRate: number): number {
  return Math.round(amount * (commissionRate / 100));
}

export function getPlanFromPriceId(priceId: string): TenantPlan | null {
  for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId === priceId) {
      return plan as TenantPlan;
    }
  }
  return null;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_WEBHOOK_SECRET &&
      env.STRIPE_STARTER_PRICE_ID &&
      env.STRIPE_GROWTH_PRICE_ID &&
      env.STRIPE_SCALE_PRICE_ID
  );
}
