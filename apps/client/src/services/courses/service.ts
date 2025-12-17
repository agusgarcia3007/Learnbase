import { http } from "@/lib/http";
import type { PaginationResult } from "@/types/pagination";
import type { Instructor } from "@/services/instructors";
import type { Module } from "@/services/modules";

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published";

export type CourseModule = {
  id: string;
  moduleId: string;
  order: number;
  module: Module;
};

export type CourseCategory = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  tenantId: string;
  instructorId: string | null;
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
  includeCertificate: boolean;
  createdAt: string;
  updatedAt: string;
  instructor: Instructor | null;
  categories: CourseCategory[];
  modulesCount: number;
  enrollmentsCount: number;
  completedCount: number;
  avgProgress: number;
  revenue: number;
  lessonsCount: number;
  certificatesCount: number;
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
  categoryIds?: string;
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
  categoryIds?: string[];
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
  includeCertificate?: boolean;
};

export type UpdateCourseRequest = {
  title?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnail?: string | null;
  previewVideoUrl?: string | null;
  instructorId?: string | null;
  categoryIds?: string[];
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
  includeCertificate?: boolean;
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
    if (params.categoryIds) searchParams.set("categoryIds", params.categoryIds);
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

  async confirmThumbnail(id: string, key: string) {
    const { data } = await http.post<UploadThumbnailResponse>(
      `/courses/${id}/thumbnail`,
      { key }
    );
    return data;
  },

  async deleteThumbnail(id: string) {
    const { data } = await http.delete<{ course: Course }>(
      `/courses/${id}/thumbnail`
    );
    return data;
  },

  async confirmVideo(id: string, key: string) {
    const { data } = await http.post<UploadVideoResponse>(
      `/courses/${id}/video`,
      { key }
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
