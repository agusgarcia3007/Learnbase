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
    storage: 15 * 1024 * 1024 * 1024,
    aiGeneration: "standard",
  },
  growth: {
    priceId: env.STRIPE_GROWTH_PRICE_ID,
    commissionRate: 2,
    monthlyPrice: 9900,
    storage: 100 * 1024 * 1024 * 1024,
    aiGeneration: "unlimited",
  },
  scale: {
    priceId: env.STRIPE_SCALE_PRICE_ID,
    commissionRate: 0,
    monthlyPrice: 34900,
    storage: 2 * 1024 * 1024 * 1024 * 1024,
    aiGeneration: "unlimited",
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
