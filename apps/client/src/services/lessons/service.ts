import { http } from "@/lib/http";

export type LessonType = "video" | "file" | "quiz";
export type LessonStatus = "draft" | "published";

export type Lesson = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: LessonType;
  videoKey: string | null;
  videoUrl: string | null;
  duration: number;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  fileUrl: string | null;
  order: number;
  isPreview: boolean;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
};

export type PaginationResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LessonListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  type?: string;
  status?: string;
  createdAt?: string;
};

export type LessonListResponse = {
  lessons: Lesson[];
  pagination: PaginationResult;
};

export type CreateLessonRequest = {
  title: string;
  description?: string;
  type: LessonType;
  videoKey?: string;
  duration?: number;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isPreview?: boolean;
  status?: LessonStatus;
};

export type UpdateLessonRequest = {
  title?: string;
  description?: string | null;
  type?: LessonType;
  videoKey?: string | null;
  duration?: number;
  fileKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  order?: number;
  isPreview?: boolean;
  status?: LessonStatus;
};

export type UploadVideoRequest = {
  video: string;
  duration?: number;
};

export type UploadVideoResponse = {
  videoKey: string;
  videoUrl: string;
};

export type UploadFileRequest = {
  file: string;
  fileName: string;
  fileSize: number;
};

export type UploadFileResponse = {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export const QUERY_KEYS = {
  LESSONS: ["lessons"],
  LESSONS_LIST: (params: LessonListParams) => ["lessons", "list", params],
  LESSON: (id: string) => ["lessons", id],
} as const;

export const LessonsService = {
  async list(params: LessonListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.type) searchParams.set("type", params.type);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/lessons?${queryString}` : "/lessons";
    const { data } = await http.get<LessonListResponse>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ lesson: Lesson }>(`/lessons/${id}`);
    return data;
  },

  async create(payload: CreateLessonRequest) {
    const { data } = await http.post<{ lesson: Lesson }>("/lessons", payload);
    return data;
  },

  async update(id: string, payload: UpdateLessonRequest) {
    const { data } = await http.put<{ lesson: Lesson }>(`/lessons/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/lessons/${id}`);
    return data;
  },

  async upload(video: string) {
    const { data } = await http.post<UploadVideoResponse>("/lessons/video", { video });
    return data;
  },

  async uploadFileStandalone(payload: UploadFileRequest) {
    const { data } = await http.post<UploadFileResponse>("/lessons/file", payload);
    return data;
  },

  async uploadVideo(id: string, payload: UploadVideoRequest) {
    const { data } = await http.post<{ lesson: Lesson }>(`/lessons/${id}/video`, payload);
    return data;
  },

  async deleteVideo(id: string) {
    const { data } = await http.delete<{ lesson: Lesson }>(`/lessons/${id}/video`);
    return data;
  },

  async uploadFile(id: string, payload: UploadFileRequest) {
    const { data } = await http.post<{ lesson: Lesson }>(`/lessons/${id}/file`, payload);
    return data;
  },

  async deleteFile(id: string) {
    const { data } = await http.delete<{ lesson: Lesson }>(`/lessons/${id}/file`);
    return data;
  },
} as const;
