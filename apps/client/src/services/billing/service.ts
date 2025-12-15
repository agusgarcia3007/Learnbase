import { http } from "@/lib/http";

export type TenantPlan = "starter" | "growth" | "scale";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export type SubscriptionResponse = {
  plan: TenantPlan;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: string | null;
  commissionRate: number;
  stripeCustomerId: string | null;
  hasSubscription: boolean;
};

export type PlanInfo = {
  id: string;
  name: string;
  monthlyPrice: number;
  commissionRate: number;
  storage: number;
  aiGeneration: string;
};

export type PlansResponse = {
  plans: PlanInfo[];
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type PortalResponse = {
  portalUrl: string;
};

export const QUERY_KEYS = {
  SUBSCRIPTION: ["billing", "subscription"] as const,
  PLANS: ["billing", "plans"] as const,
} as const;

export const BillingService = {
  async getSubscription() {
    const { data } = await http.get<SubscriptionResponse>("/billing/subscription");
    return data;
  },

  async getPlans() {
    const { data } = await http.get<PlansResponse>("/billing/plans");
    return data;
  },

  async createSubscription(plan: TenantPlan) {
    const { data } = await http.post<CheckoutResponse>("/billing/subscription", { plan });
    return data;
  },

  async createPortalSession() {
    const { data } = await http.post<PortalResponse>("/billing/portal", {});
    return data;
  },

  async cancelSubscription() {
    const { data } = await http.post<{ success: boolean }>("/billing/subscription/cancel", {});
    return data;
  },
} as const;
