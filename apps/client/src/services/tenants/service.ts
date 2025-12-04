import { http } from "@/lib/http";

export type TenantTheme = "default" | "slate" | "rose" | "emerald" | "tangerine" | "ocean";

export type TenantSocialLinks = {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  theme: TenantTheme | null;
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
  showHeaderName: boolean;
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

export type PaginationResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  showHeaderName?: boolean;
};

export type UploadLogoResponse = {
  logoKey: string;
  logoUrl: string;
  tenant: Tenant;
};

export type TenantStats = {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
};

export const QUERY_KEYS = {
  TENANTS: ["tenants"],
  TENANTS_LIST: (params: TenantListParams) => ["tenants", "list", params],
  TENANT: (slug: string) => ["tenants", slug],
  TENANT_STATS: (id: string) => ["tenants", id, "stats"],
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
} as const;
