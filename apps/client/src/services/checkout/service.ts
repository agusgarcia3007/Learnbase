import { http } from "@/lib/http";

export type CheckoutSessionResponse =
  | {
      type: "checkout";
      checkoutUrl: string;
      sessionId: string;
    }
  | {
      type: "free";
      message: string;
    };

export type SessionStatusResponse = {
  status: string;
  paymentStatus: string;
};

export const CheckoutService = {
  async createSession(courseIds: string[]) {
    const { data } = await http.post<CheckoutSessionResponse>("/checkout/session", { courseIds });
    return data;
  },

  async getSessionStatus(sessionId: string) {
    const { data } = await http.get<SessionStatusResponse>(`/checkout/session/${sessionId}`);
    return data;
  },
} as const;
