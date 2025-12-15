import { http } from "@/lib/http";

export type ConnectAccountStatus = "not_started" | "pending" | "active" | "restricted";

export type ConnectStatusResponse = {
  status: ConnectAccountStatus;
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
  STATUS: ["connect", "status"] as const,
} as const;

export const ConnectService = {
  async getStatus() {
    const { data } = await http.get<ConnectStatusResponse>("/connect/status");
    return data;
  },

  async startOnboarding() {
    const { data } = await http.post<OnboardingResponse>("/connect/onboard", {});
    return data;
  },

  async refreshOnboarding() {
    const { data } = await http.post<OnboardingResponse>("/connect/refresh", {});
    return data;
  },

  async getDashboardLink() {
    const { data } = await http.get<DashboardResponse>("/connect/dashboard");
    return data;
  },
} as const;
