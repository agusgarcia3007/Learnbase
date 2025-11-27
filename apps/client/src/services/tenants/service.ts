import { http } from "@/lib/http";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type CreateTenantRequest = {
  slug: string;
  name: string;
};

export type { Tenant, CreateTenantRequest };

export const QUERY_KEYS = {
  TENANTS: ["tenants"],
  TENANT: (slug: string) => ["tenants", slug],
} as const;

export const TenantsService = {
  async list() {
    const { data } = await http.get<{ tenants: Tenant[] }>("/tenants");
    return data;
  },

  async getBySlug(slug: string) {
    const { data } = await http.get<{ tenant: Tenant }>(`/tenants/${slug}`);
    return data;
  },

  async create(payload: CreateTenantRequest) {
    const { data } = await http.post<{ tenant: Tenant }>("/tenants", payload);
    return data;
  },
} as const;
