import { http } from "@/lib/http";
import type { PaginationResult } from "@/types/pagination";

export type TenantTheme = "default" | "slate" | "rose" | "emerald" | "tangerine" | "ocean";
export type TenantMode = "light" | "dark" | "auto";
export type BackgroundPattern = "none" | "grid" | "dots" | "waves";

export type CustomTheme = {
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  accent?: string;
  accentForeground?: string;
  destructive?: string;
  destructiveForeground?: string;
  border?: string;
  input?: string;
  ring?: string;
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  sidebar?: string;
  sidebarForeground?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
  sidebarAccent?: string;
  sidebarAccentForeground?: string;
  sidebarBorder?: string;
  sidebarRing?: string;
  shadow?: string;
  shadowLg?: string;
  radius?: string;
  backgroundDark?: string;
  foregroundDark?: string;
  cardDark?: string;
  cardForegroundDark?: string;
  popoverDark?: string;
  popoverForegroundDark?: string;
  primaryDark?: string;
  primaryForegroundDark?: string;
  secondaryDark?: string;
  secondaryForegroundDark?: string;
  mutedDark?: string;
  mutedForegroundDark?: string;
  accentDark?: string;
  accentForegroundDark?: string;
  destructiveDark?: string;
  destructiveForegroundDark?: string;
  borderDark?: string;
  inputDark?: string;
  ringDark?: string;
  chart1Dark?: string;
  chart2Dark?: string;
  chart3Dark?: string;
  chart4Dark?: string;
  chart5Dark?: string;
  sidebarDark?: string;
  sidebarForegroundDark?: string;
  sidebarPrimaryDark?: string;
  sidebarPrimaryForegroundDark?: string;
  sidebarAccentDark?: string;
  sidebarAccentForegroundDark?: string;
  sidebarBorderDark?: string;
  sidebarRingDark?: string;
  shadowDark?: string;
  shadowLgDark?: string;
  fontHeading?: string;
  fontBody?: string;
};

export type TenantSocialLinks = {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
};

export type TenantCertificateSettings = {
  signatureImageKey?: string;
  signatureImageUrl?: string | null;
  signatureTitle?: string;
  customMessage?: string;
};

export type TenantAiAssistantSettings = {
  enabled?: boolean;
  name?: string;
  customPrompt?: string;
  preferredLanguage?: "auto" | "en" | "es" | "pt";
  tone?: "professional" | "friendly" | "casual" | "academic";
  avatarKey?: string;
  avatarUrl?: string | null;
};

export type TenantAuthSettings = {
  provider: "local" | "firebase";
  firebaseProjectId?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  enableGoogle?: boolean;
  enableApple?: boolean;
  enableEmailPassword?: boolean;
  requiredClaims?: string[];
  claimMappings?: Array<{ claim: string; courseId: string }>;
};

export type TenantStatus = "active" | "suspended" | "cancelled";

export type TenantFeatures = {
  analytics?: boolean;
  certificates?: boolean;
  customDomain?: boolean;
  aiAnalysis?: boolean;
  whiteLabel?: boolean;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  favicon: string | null;
  theme: TenantTheme | null;
  mode: TenantMode | null;
  customDomain: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  socialLinks: TenantSocialLinks | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCta: string | null;
  footerText: string | null;
  heroPattern: BackgroundPattern | null;
  coursesPagePattern: BackgroundPattern | null;
  showHeaderName: boolean;
  customTheme: CustomTheme | null;
  certificateSettings: TenantCertificateSettings | null;
  aiAssistantSettings: TenantAiAssistantSettings | null;
  authSettings: TenantAuthSettings | null;
  maxUsers: number | null;
  maxCourses: number | null;
  maxStorageBytes: string | null;
  features: TenantFeatures | null;
  status: TenantStatus;
  plan: "starter" | "growth" | "scale";
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "trial_expired" | null;
  trialEndsAt: string | null;
  commissionRate: number;
  chargesEnabled: boolean;
  published: boolean;
  language: "en" | "es" | "pt" | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  usersCount?: number;
  coursesCount?: number;
  videosCount?: number;
  quizzesCount?: number;
  documentsCount?: number;
  storageUsedBytes?: number;
  activeUsers30d?: number;
  totalSessions30d?: number;
};

export type ConfigureDomainResponse = {
  tenant: Tenant;
  cnameTarget: string;
};

export type VerifyDomainResponse = {
  verified: boolean;
  status: string;
  sslStatus: string;
  cnameTarget: string;
};

export type TenantListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  createdAt?: string;
};

export type TenantListResponse = {
  tenants: Tenant[];
  pagination: PaginationResult | null;
};

export type CreateTenantRequest = {
  slug: string;
  name: string;
};

export type UpdateTenantRequest = {
  slug?: string;
  name: string;
  theme?: TenantTheme | null;
  mode?: TenantMode | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  socialLinks?: TenantSocialLinks | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCta?: string | null;
  footerText?: string | null;
  heroPattern?: BackgroundPattern | null;
  coursesPagePattern?: BackgroundPattern | null;
  showHeaderName?: boolean;
  language?: "en" | "es" | "pt";
  customTheme?: CustomTheme | null;
  certificateSettings?: TenantCertificateSettings | null;
  aiAssistantSettings?: TenantAiAssistantSettings | null;
  status?: TenantStatus;
  maxUsers?: number | null;
  maxCourses?: number | null;
  maxStorageBytes?: string | null;
  features?: TenantFeatures | null;
};

export type UploadLogoResponse = {
  logoKey: string;
  logoUrl: string;
  tenant: Tenant;
};

export type UploadSignatureResponse = {
  signatureKey: string;
  signatureUrl: string;
  tenant: Tenant;
};

export type UploadAiAvatarResponse = {
  avatarKey: string;
  avatarUrl: string;
  tenant: Tenant;
};

export type TenantStats = {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalCertificates: number;
  newStudents30d: number;
  newEnrollments30d: number;
};

export type TenantTrendPeriod = "7d" | "30d" | "90d";

export type TenantTrendDataPoint = {
  date: string;
  count: number;
};

export type TenantTrendsData = {
  enrollmentGrowth: TenantTrendDataPoint[];
  completionGrowth: TenantTrendDataPoint[];
  period: string;
};

export type TenantTopCourse = {
  id: string;
  title: string;
  enrollments: number;
  completionRate: number;
};

export type TenantActivityType = "enrollment" | "completion" | "certificate";

export type TenantActivity = {
  id: string;
  type: TenantActivityType;
  userId: string;
  userName: string;
  userAvatar: string | null;
  courseId: string;
  courseName: string;
  createdAt: string;
};

export type OnboardingSteps = {
  basicInfo: boolean;
  category: boolean;
  instructor: boolean;
  module: boolean;
  course: boolean;
};

export const QUERY_KEYS = {
  TENANTS: ["tenants"],
  TENANTS_LIST: (params: TenantListParams) => ["tenants", "list", params],
  TENANT: (slug: string) => ["tenants", slug],
  TENANT_STATS: (id: string) => ["tenants", id, "stats"],
  TENANT_ONBOARDING: (id: string) => ["tenants", id, "onboarding"],
  DOMAIN_VERIFICATION: (id: string) => ["tenants", id, "domain-verification"],
  TENANT_TRENDS: (id: string, period: TenantTrendPeriod) => ["tenants", id, "trends", period],
  TENANT_TOP_COURSES: (id: string, limit: number) => ["tenants", id, "top-courses", limit],
  TENANT_ACTIVITY: (id: string, limit: number) => ["tenants", id, "activity", limit],
} as const;

export const TenantsService = {
  async list(params: TenantListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/tenants?${queryString}` : "/tenants";
    const { data } = await http.get<TenantListResponse>(url);
    return data;
  },

  async getBySlug(slug: string) {
    const { data } = await http.get<{ tenant: Tenant }>(
      `/tenants/by-slug/${slug}`
    );
    return data;
  },

  async create(payload: CreateTenantRequest) {
    const { data } = await http.post<{ tenant: Tenant }>("/tenants", payload);
    return data;
  },

  async update(id: string, payload: UpdateTenantRequest) {
    const { data } = await http.put<{ tenant: Tenant }>(
      `/tenants/${id}`,
      payload
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/tenants/${id}`);
    return data;
  },

  async uploadLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append("logo", file);
    const { data } = await http.post<UploadLogoResponse>(
      `/tenants/${id}/logo`,
      formData
    );
    return data;
  },

  async deleteLogo(id: string) {
    const { data } = await http.delete<{ tenant: Tenant }>(
      `/tenants/${id}/logo`
    );
    return data;
  },

  async getStats(id: string) {
    const { data } = await http.get<{ stats: TenantStats }>(
      `/tenants/${id}/stats`
    );
    return data;
  },

  async getOnboarding(id: string) {
    const { data } = await http.get<{ steps: OnboardingSteps }>(
      `/tenants/${id}/onboarding`
    );
    return data;
  },

  async configureDomain(id: string, customDomain: string | null) {
    const { data } = await http.put<ConfigureDomainResponse>(
      `/tenants/${id}/domain`,
      { customDomain }
    );
    return data;
  },

  async verifyDomain(id: string) {
    const { data } = await http.get<VerifyDomainResponse>(
      `/tenants/${id}/domain/verify`
    );
    return data;
  },

  async removeDomain(id: string) {
    const { data } = await http.delete<{ tenant: Tenant }>(
      `/tenants/${id}/domain`
    );
    return data;
  },

  async uploadSignature(id: string, file: File) {
    const formData = new FormData();
    formData.append("signature", file);
    const { data } = await http.post<UploadSignatureResponse>(
      `/tenants/${id}/certificate-signature`,
      formData
    );
    return data;
  },

  async deleteSignature(id: string) {
    const { data } = await http.delete<{ tenant: Tenant }>(
      `/tenants/${id}/certificate-signature`
    );
    return data;
  },

  async uploadAiAvatar(id: string, file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await http.post<UploadAiAvatarResponse>(
      `/tenants/${id}/ai-avatar`,
      formData
    );
    return data;
  },

  async deleteAiAvatar(id: string) {
    const { data } = await http.delete<{ tenant: Tenant }>(
      `/tenants/${id}/ai-avatar`
    );
    return data;
  },

  async updateAuthSettings(
    id: string,
    payload: {
      provider: "local" | "firebase";
      firebaseProjectId?: string;
      firebaseApiKey?: string;
      firebaseAuthDomain?: string;
      enableGoogle?: boolean;
      enableApple?: boolean;
      enableEmailPassword?: boolean;
      requiredClaims?: string[];
      claimMappings?: Array<{ claim: string; courseId: string }>;
    }
  ) {
    const { data } = await http.put<{ tenant: Tenant }>(
      `/tenants/${id}/auth-settings`,
      payload
    );
    return data;
  },

  async getTrends(id: string, period: TenantTrendPeriod = "30d") {
    const { data } = await http.get<{ trends: TenantTrendsData }>(
      `/tenants/${id}/stats/trends?period=${period}`
    );
    return data;
  },

  async getTopCourses(id: string, limit = 5) {
    const { data } = await http.get<{ courses: TenantTopCourse[] }>(
      `/tenants/${id}/stats/top-courses?limit=${limit}`
    );
    return data;
  },

  async getActivity(id: string, limit = 10) {
    const { data } = await http.get<{ activities: TenantActivity[] }>(
      `/tenants/${id}/stats/activity?limit=${limit}`
    );
    return data;
  },
} as const;
