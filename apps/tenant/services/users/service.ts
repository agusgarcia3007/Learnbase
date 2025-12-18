import { http } from "@/lib/http";

export type UserRole = "superadmin" | "owner" | "admin" | "student";

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  emailVerified: boolean;
  enrollmentsCount: number;
  completedCount: number;
  avgProgress: number;
  lastActivity: string | null;
  createdAt: string;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: string;
};

export type UserListResponse = {
  users: TenantUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type InviteUserRequest = {
  email: string;
  name: string;
  role: "admin" | "student";
};

export type UpdateUserRequest = {
  id: string;
  name?: string;
  role?: "admin" | "student";
};

export const QUERY_KEYS = {
  USERS: ["users"],
  USERS_LIST: (params: UserListParams) => ["users", "list", params],
  USER: (id: string) => ["users", id],
} as const;

export const UsersService = {
  async list(params: UserListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : "/users";
    const { data } = await http.get<UserListResponse>(url);
    return data;
  },

  async invite(payload: InviteUserRequest) {
    const { data } = await http.post<{ user: TenantUser }>("/users/invite", payload);
    return data;
  },

  async update(id: string, payload: Omit<UpdateUserRequest, "id">) {
    const { data } = await http.put<{ user: TenantUser }>(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/users/${id}`);
    return data;
  },
} as const;
