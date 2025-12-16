import { http } from "@/lib/http";

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
  EARNINGS: ["revenue", "earnings"] as const,
  PAYMENTS: ["revenue", "payments"] as const,
} as const;

export const RevenueService = {
  async getEarnings() {
    const { data } = await http.get<EarningsResponse>("/revenue/earnings");
    return data;
  },

  async getPayments(params: PaymentsParams = {}) {
    const { data } = await http.get<PaymentsResponse>("/revenue/payments", { params });
    return data;
  },

  async exportPayments(params: ExportParams) {
    const response = await http.post("/revenue/payments/export", params, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
} as const;
