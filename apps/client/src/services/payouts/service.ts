import { http } from "@/lib/http";

export type PayoutAccountStatus = "not_started" | "pending" | "active" | "restricted";

export type PayoutStatusResponse = {
  status: PayoutAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
};

export type OnboardingResponse = {
  onboardingUrl: string;
};

export type DashboardResponse = {
  dashboardUrl: string;
};

export const QUERY_KEYS = {
  STATUS: ["payouts", "status"] as const,
} as const;

export const PayoutsService = {
  async getStatus() {
    const { data } = await http.get<PayoutStatusResponse>("/payouts/status");
    return data;
  },

  async startOnboarding() {
    const { data } = await http.post<OnboardingResponse>("/payouts/onboard", {});
    return data;
  },

  async refreshOnboarding() {
    const { data } = await http.post<OnboardingResponse>("/payouts/refresh", {});
    return data;
  },

  async getDashboardLink() {
    const { data } = await http.post<DashboardResponse>("/payouts/dashboard", {});
    return data;
  },
} as const;
