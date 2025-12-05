import { http } from "@/lib/http";
import type { Video } from "@/services/videos";
import type { Document } from "@/services/documents";
import type { Quiz } from "@/services/quizzes";
import type { PaginationResult } from "@/types/pagination";

export type ModuleStatus = "draft" | "published";
export type ContentType = "video" | "document" | "quiz";

export type Module = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: ModuleStatus;
  order: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ModuleItem = {
  id: string;
  contentType: ContentType;
  contentId: string;
  order: number;
  isPreview: boolean;
  content: Video | Document | Quiz;
};

export type ModuleWithItems = Module & {
  items: ModuleItem[];
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

export type UpdateModuleItemsRequest = {
  items: Array<{
    contentType: ContentType;
    contentId: string;
    order?: number;
    isPreview?: boolean;
  }>;
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
    const { data } = await http.get<{ module: ModuleWithItems }>(`/modules/${id}`);
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

  async updateItems(id: string, payload: UpdateModuleItemsRequest) {
    const { data } = await http.put<{ module: ModuleWithItems }>(
      `/modules/${id}/items`,
      payload
    );
    return data;
  },
} as const;
