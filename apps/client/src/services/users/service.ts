import { http } from "@/lib/http";
import type { PaginationResult } from "@/types/pagination";

export type UserRole = "superadmin" | "owner" | "admin" | "student";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string | null;
    slug: string | null;
  } | null;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: string;
  tenantId?: string;
  createdAt?: string;
};

export type UserListResponse = {
  users: User[];
  pagination: PaginationResult;
};

export type TenantUser = Omit<User, "tenant">;

export type TenantUserListResponse = {
  users: TenantUser[];
  pagination: PaginationResult;
};

export type UpdateUserRequest = {
  name?: string;
  role?: UserRole;
  tenantId?: string | null;
};

export type TenantUserListParams = Omit<UserListParams, "tenantId">;

export const QUERY_KEYS = {
  USERS: ["users"],
  USERS_LIST: (params: UserListParams) => ["users", "list", params],
  USER: (id: string) => ["users", id],
  TENANT_USERS: ["tenant-users"],
  TENANT_USERS_LIST: (params: TenantUserListParams) => ["tenant-users", "list", params],
} as const;

export const UsersService = {
  async list(params: UserListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : "/users";
    const { data } = await http.get<UserListResponse>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ user: User }>(`/users/${id}`);
    return data;
  },

  async update(id: string, payload: UpdateUserRequest) {
    const { data } = await http.put<{ user: User }>(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/users/${id}`);
    return data;
  },

  async listTenantUsers(params: TenantUserListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/users/tenant?${queryString}` : "/users/tenant";
    const { data } = await http.get<TenantUserListResponse>(url);
    return data;
  },
} as const;
