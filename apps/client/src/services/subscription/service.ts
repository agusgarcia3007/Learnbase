import { http } from "@/lib/http";

export type TenantPlan = "starter" | "growth" | "scale";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "trial_expired";

export type SubscriptionResponse = {
  plan: TenantPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: string | null;
  commissionRate: number;
  stripeCustomerId: string | null;
  hasSubscription: boolean;
  hasValidSubscription: boolean;
  storageUsedBytes: number;
  storageLimitBytes: number;
};

export type PlanInfo = {
  id: string;
  name: string;
  monthlyPrice: number;
  commissionRate: number;
  storageGb: number;
  aiGeneration: string;
  maxStudents: number | null;
  maxCourses: number | null;
  customDomain: boolean;
  certificates: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
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
  SUBSCRIPTION: ["subscription"] as const,
  PLANS: ["subscription", "plans"] as const,
} as const;

export const SubscriptionService = {
  async getSubscription() {
    const { data } = await http.get<SubscriptionResponse>("/subscription");
    return data;
  },

  async getPlans() {
    const { data } = await http.get<PlansResponse>("/subscription/plans");
    return data;
  },

  async createSubscription(plan: TenantPlan) {
    const { data } = await http.post<CheckoutResponse>("/subscription", { plan });
    return data;
  },

  async createPortalSession() {
    const { data } = await http.post<PortalResponse>("/subscription/portal", {});
    return data;
  },

  async cancelSubscription() {
    const { data } = await http.post<{ success: boolean }>("/subscription/cancel", {});
    return data;
  },
} as const;
