import { http } from "@/lib/http";
import type { PaginationResult } from "@/types/pagination";
import type { Instructor } from "@/services/instructors";
import type { Category } from "@/services/categories";
import type { Module } from "@/services/modules";

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";

export type CourseModule = {
  id: string;
  moduleId: string;
  order: number;
  module: Module;
};

export type Course = {
  id: string;
  tenantId: string;
  instructorId: string | null;
  categoryId: string | null;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  previewVideoUrl: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  level: CourseLevel;
  tags: string[] | null;
  language: string | null;
  status: CourseStatus;
  order: number;
  features: string[] | null;
  requirements: string[] | null;
  objectives: string[] | null;
  createdAt: string;
  updatedAt: string;
  instructor: Instructor | null;
  category: Category | null;
  modulesCount: number;
};

export type CourseWithModules = Course & {
  modules: CourseModule[];
};

export type CourseListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  level?: string;
  categoryId?: string;
  createdAt?: string;
};

export type CourseListResponse = {
  courses: Course[];
  pagination: PaginationResult;
};

export type CreateCourseRequest = {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideoUrl?: string;
  instructorId?: string;
  categoryId?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  level?: CourseLevel;
  tags?: string[];
  language?: string;
  status?: CourseStatus;
  features?: string[];
  requirements?: string[];
  objectives?: string[];
};

export type UpdateCourseRequest = {
  title?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnail?: string | null;
  previewVideoUrl?: string | null;
  instructorId?: string | null;
  categoryId?: string | null;
  price?: number;
  originalPrice?: number | null;
  currency?: string;
  level?: CourseLevel;
  tags?: string[] | null;
  language?: string;
  status?: CourseStatus;
  order?: number;
  features?: string[] | null;
  requirements?: string[] | null;
  objectives?: string[] | null;
};

export type UpdateCourseModulesRequest = {
  modules: Array<{ moduleId: string; order?: number }>;
};

export type UploadThumbnailResponse = {
  thumbnailKey: string;
  thumbnailUrl: string;
  course: Course;
};

export type UploadVideoResponse = {
  videoKey: string;
  videoUrl: string;
  course: Course;
};

export const QUERY_KEYS = {
  COURSES: ["courses"],
  COURSES_LIST: (params: CourseListParams) => ["courses", "list", params],
  COURSE: (id: string) => ["courses", id],
} as const;

export const CoursesService = {
  async list(params: CourseListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.level) searchParams.set("level", params.level);
    if (params.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/courses?${queryString}` : "/courses";
    const { data } = await http.get<CourseListResponse>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ course: CourseWithModules }>(`/courses/${id}`);
    return data;
  },

  async create(payload: CreateCourseRequest) {
    const { data } = await http.post<{ course: CourseWithModules }>(
      "/courses",
      payload
    );
    return data;
  },

  async update(id: string, payload: UpdateCourseRequest) {
    const { data } = await http.put<{ course: Course }>(
      `/courses/${id}`,
      payload
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/courses/${id}`);
    return data;
  },

  async updateModules(id: string, payload: UpdateCourseModulesRequest) {
    const { data } = await http.put<{ course: CourseWithModules }>(
      `/courses/${id}/modules`,
      payload
    );
    return data;
  },

  async uploadThumbnail(id: string, thumbnail: string) {
    const { data } = await http.post<UploadThumbnailResponse>(
      `/courses/${id}/thumbnail`,
      { thumbnail }
    );
    return data;
  },

  async deleteThumbnail(id: string) {
    const { data } = await http.delete<{ course: Course }>(
      `/courses/${id}/thumbnail`
    );
    return data;
  },

  async uploadVideo(id: string, video: string) {
    const { data } = await http.post<UploadVideoResponse>(
      `/courses/${id}/video`,
      { video }
    );
    return data;
  },

  async deleteVideo(id: string) {
    const { data } = await http.delete<{ course: Course }>(
      `/courses/${id}/video`
    );
    return data;
  },
} as const;
