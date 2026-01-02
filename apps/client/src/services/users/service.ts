import { http } from "@/lib/http";
import type { PaginationResult } from "@/types/pagination";
import type { UserRole } from "@/lib/permissions";

export type { UserRole };

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

export type TenantUser = Omit<User, "tenant"> & {
  enrollmentsCount: number;
  completedCount: number;
  lastActivity: string | null;
  emailVerified: boolean;
};

export type TenantUserListResponse = {
  users: TenantUser[];
  pagination: PaginationResult;
};

export type UpdateUserRequest = {
  name?: string;
  role?: UserRole;
  tenantId?: string | null;
};

export type UpdateTenantUserRequest = {
  name?: string;
  role?: "instructor" | "student";
};

export type InviteUserRequest = {
  email: string;
  name: string;
  role: "instructor" | "student";
};

export type BulkDeleteRequest = {
  ids: string[];
};

export type BulkUpdateRoleRequest = {
  ids: string[];
  role: "instructor" | "student";
};

export type ImpersonateResponse = {
  user: Omit<User, "tenant"> & { tenantSlug: string | null };
  accessToken: string;
  refreshToken: string;
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

  async updateTenantUser(id: string, payload: UpdateTenantUserRequest) {
    const { data } = await http.put<{ user: TenantUser }>(
      `/users/tenant/${id}`,
      payload
    );
    return data;
  },

  async inviteUser(payload: InviteUserRequest) {
    const { data } = await http.post<{ user: TenantUser }>(
      "/users/tenant/invite",
      payload
    );
    return data;
  },

  async deleteTenantUser(id: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/users/tenant/${id}`
    );
    return data;
  },

  async bulkDeleteTenantUsers(ids: string[]) {
    const { data } = await http.delete<{ deleted: number }>(
      "/users/tenant/bulk",
      { data: { ids } }
    );
    return data;
  },

  async bulkUpdateRole(payload: BulkUpdateRoleRequest) {
    const { data } = await http.put<{ updated: number }>(
      "/users/tenant/bulk/role",
      payload
    );
    return data;
  },

  async exportTenantUsersCsv() {
    const response = await http.get("/users/tenant/export", {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  async impersonate(userId: string) {
    const { data } = await http.post<ImpersonateResponse>(
      `/users/${userId}/impersonate`
    );
    return data;
  },
} as const;
