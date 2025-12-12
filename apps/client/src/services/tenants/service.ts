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
  createdAt: string;
  updatedAt: string;
  usersCount?: number;
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
  customTheme?: CustomTheme | null;
  certificateSettings?: TenantCertificateSettings | null;
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

export type TenantStats = {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
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

  async uploadLogo(id: string, logo: string) {
    const { data } = await http.post<UploadLogoResponse>(
      `/tenants/${id}/logo`,
      { logo }
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

  async uploadSignature(id: string, signature: string) {
    const { data } = await http.post<UploadSignatureResponse>(
      `/tenants/${id}/certificate-signature`,
      { signature }
    );
    return data;
  },

  async deleteSignature(id: string) {
    const { data } = await http.delete<{ tenant: Tenant }>(
      `/tenants/${id}/certificate-signature`
    );
    return data;
  },
} as const;
