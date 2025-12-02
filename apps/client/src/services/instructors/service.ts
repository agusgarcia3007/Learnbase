import { http } from "@/lib/http";
import type { PaginationResult } from "@/services/lessons";

export type SocialLinks = {
  twitter?: string;
  linkedin?: string;
  github?: string;
};

export type Instructor = {
  id: string;
  tenantId: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  title: string | null;
  email: string | null;
  website: string | null;
  socialLinks: SocialLinks | null;
  order: number;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InstructorListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  createdAt?: string;
};

export type InstructorListResponse = {
  instructors: Instructor[];
  pagination: PaginationResult;
};

export type CreateInstructorRequest = {
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  email?: string;
  website?: string;
  socialLinks?: SocialLinks;
};

export type UpdateInstructorRequest = {
  name?: string;
  avatar?: string | null;
  bio?: string | null;
  title?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: SocialLinks | null;
  order?: number;
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
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/instructors?${queryString}` : "/instructors";
    const { data } = await http.get<InstructorListResponse>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ instructor: Instructor }>(`/instructors/${id}`);
    return data;
  },

  async create(payload: CreateInstructorRequest) {
    const { data } = await http.post<{ instructor: Instructor }>(
      "/instructors",
      payload
    );
    return data;
  },

  async update(id: string, payload: UpdateInstructorRequest) {
    const { data } = await http.put<{ instructor: Instructor }>(
      `/instructors/${id}`,
      payload
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/instructors/${id}`);
    return data;
  },
} as const;
