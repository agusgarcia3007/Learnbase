import { http } from "@/lib/http";

export type Instructor = {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  email: string | null;
  avatar: string | null;
  title: string | null;
  bio: string | null;
  website: string | null;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  } | null;
  coursesCount: number;
  isOwner: boolean;
  createdAt: string;
};

export type InstructorListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
};

export type InstructorListResponse = {
  instructors: Instructor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type InviteInstructorRequest = {
  email: string;
  name: string;
  title?: string;
};

export type UpdateInstructorRequest = {
  id: string;
  title?: string;
  email?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
};

export const QUERY_KEYS = {
  INSTRUCTORS: ["instructors"],
  INSTRUCTORS_LIST: (params: InstructorListParams) => ["instructors", "list", params],
  INSTRUCTOR: (id: string) => ["instructors", id],
} as const;

export const InstructorsService = {
  async list(params: InstructorListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);

    const queryString = searchParams.toString();
    const url = queryString ? `/instructors?${queryString}` : "/instructors";
    const { data } = await http.get<InstructorListResponse>(url);
    return data;
  },

  async invite(payload: InviteInstructorRequest) {
    const { data } = await http.post<{ instructor: Instructor }>("/instructors/invite", payload);
    return data;
  },

  async update(id: string, payload: Omit<UpdateInstructorRequest, "id">) {
    const { data } = await http.put<{ instructor: Instructor }>(`/instructors/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/instructors/${id}`);
    return data;
  },
} as const;
