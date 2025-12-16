import { http } from "@/lib/http";

export type TenantPlan = "starter" | "growth" | "scale";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export type SubscriptionResponse = {
  plan: TenantPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: string | null;
  commissionRate: number;
  stripeCustomerId: string | null;
  hasSubscription: boolean;
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

export type MonthlyEarning = {
  month: string;
  gross: number;
  net: number;
  fees: number;
};

export type EarningsResponse = {
  grossEarnings: number;
  netEarnings: number;
  platformFees: number;
  transactionCount: number;
  monthlyBreakdown: MonthlyEarning[];
};

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded";

export type PaymentCourse = {
  id: string;
  title: string;
};

export type Payment = {
  id: string;
  paidAt: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  courses: PaymentCourse[];
  amount: number;
  netAmount: number;
  currency: string;
  status: PaymentStatus;
};

export type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PaymentsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  paidAt?: string;
};

export type ExportParams = {
  format: "csv" | "xlsx";
  status?: string;
  paidAt?: string;
};

export const QUERY_KEYS = {
  SUBSCRIPTION: ["billing", "subscription"] as const,
  PLANS: ["billing", "plans"] as const,
  EARNINGS: ["billing", "earnings"] as const,
  PAYMENTS: ["billing", "payments"] as const,
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

  async getEarnings() {
    const { data } = await http.get<EarningsResponse>("/billing/earnings");
    return data;
  },

  async getPayments(params: PaymentsParams = {}) {
    const { data } = await http.get<PaymentsResponse>("/billing/payments", { params });
    return data;
  },

  async exportPayments(params: ExportParams) {
    const response = await http.post("/billing/payments/export", params, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
} as const;
