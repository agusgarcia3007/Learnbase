import { getRefreshToken, http, clearTokens } from "@/lib/http";

type User = {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: "superadmin" | "owner" | "admin" | "student";
  tenantId: string | null;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type LoginRequest = {
  email: string;
  password: string;
};

type SignupRequest = {
  email: string;
  password: string;
  name: string;
  locale?: string;
};

type ForgotPasswordRequest = {
  email: string;
};

type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type {
  User,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
};

export const AuthService = {
  async login(payload: LoginRequest) {
    const { data } = await http.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async signup(payload: SignupRequest) {
    const { data } = await http.post<AuthResponse>("/auth/signup", payload);
    return data;
  },

  async refresh() {
    const refreshToken = getRefreshToken();
    const { data } = await http.post<{ accessToken: string }>("/auth/refresh", {
      refreshToken,
    });
    return data;
  },

  async logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await http.post("/auth/logout", { refreshToken });
    }
    clearTokens();
  },

  async forgotPassword(payload: ForgotPasswordRequest) {
    const { data } = await http.post<{ message: string }>(
      "/auth/forgot-password",
      payload
    );
    return data;
  },

  async resetPassword(payload: ResetPasswordRequest) {
    const { data } = await http.post<{ message: string }>(
      "/auth/reset-password",
      payload
    );
    return data;
  },

  async verifyEmail(token: string) {
    const { data } = await http.post<{ message: string }>("/auth/verify-email", {
      token,
    });
    return data;
  },

  async resendVerification() {
    const { data } = await http.post<{ message: string }>(
      "/auth/resend-verification",
      {}
    );
    return data;
  },
} as const;
