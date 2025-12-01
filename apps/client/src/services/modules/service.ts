import { http } from "@/lib/http";
import type { Lesson, PaginationResult } from "@/services/lessons";

export type ModuleStatus = "draft" | "published";

export type Module = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: ModuleStatus;
  order: number;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ModuleLesson = {
  id: string;
  lessonId: string;
  order: number;
  lesson: Lesson;
};

export type ModuleWithLessons = Module & {
  lessons: ModuleLesson[];
};

export type ModuleListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  createdAt?: string;
};

export type ModuleListResponse = {
  modules: Module[];
  pagination: PaginationResult;
};

export type CreateModuleRequest = {
  title: string;
  description?: string;
  status?: ModuleStatus;
};

export type UpdateModuleRequest = {
  title?: string;
  description?: string | null;
  status?: ModuleStatus;
  order?: number;
};

export type UpdateModuleLessonsRequest = {
  lessons: Array<{ lessonId: string; order?: number }>;
};

export const QUERY_KEYS = {
  MODULES: ["modules"],
  MODULES_LIST: (params: ModuleListParams) => ["modules", "list", params],
  MODULE: (id: string) => ["modules", id],
} as const;

export const ModulesService = {
  async list(params: ModuleListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/modules?${queryString}` : "/modules";
    const { data } = await http.get<ModuleListResponse>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ module: ModuleWithLessons }>(`/modules/${id}`);
    return data;
  },

  async create(payload: CreateModuleRequest) {
    const { data } = await http.post<{ module: Module }>("/modules", payload);
    return data;
  },

  async update(id: string, payload: UpdateModuleRequest) {
    const { data } = await http.put<{ module: Module }>(`/modules/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/modules/${id}`);
    return data;
  },

  async updateLessons(id: string, payload: UpdateModuleLessonsRequest) {
    const { data } = await http.put<{ module: ModuleWithLessons }>(
      `/modules/${id}/lessons`,
      payload
    );
    return data;
  },
} as const;
