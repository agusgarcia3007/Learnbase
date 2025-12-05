import { http } from "@/lib/http";

export type ContentStatus = "draft" | "published";

export type Video = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  videoKey: string | null;
  videoUrl: string | null;
  duration: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type VideoListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  createdAt?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CreateVideoRequest = {
  title: string;
  description?: string;
  videoKey?: string;
  duration?: number;
  status?: ContentStatus;
};

export type UpdateVideoRequest = {
  title?: string;
  description?: string | null;
  videoKey?: string | null;
  duration?: number;
  status?: ContentStatus;
};

export type UploadVideoResponse = {
  videoKey: string;
  videoUrl: string;
};

export const QUERY_KEYS = {
  VIDEOS: ["videos"],
  VIDEOS_LIST: (params?: VideoListParams) => ["videos", "list", params ?? {}],
  VIDEO: (id: string) => ["videos", id],
} as const;

export const VideosService = {
  async list(params: VideoListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/videos?${queryString}` : "/videos";
    const { data } = await http.get<{ videos: Video[]; pagination: PaginationMeta }>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ video: Video }>(`/videos/${id}`);
    return data;
  },

  async create(payload: CreateVideoRequest) {
    const { data } = await http.post<{ video: Video }>("/videos", payload);
    return data;
  },

  async update(id: string, payload: UpdateVideoRequest) {
    const { data } = await http.put<{ video: Video }>(`/videos/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/videos/${id}`);
    return data;
  },

  async upload(video: string) {
    const { data } = await http.post<UploadVideoResponse>("/videos/upload", { video });
    return data;
  },

  async uploadVideo(id: string, video: string, duration?: number) {
    const { data } = await http.post<{ video: Video }>(`/videos/${id}/video`, {
      video,
      duration,
    });
    return data;
  },

  async deleteVideo(id: string) {
    const { data } = await http.delete<{ video: Video }>(`/videos/${id}/video`);
    return data;
  },
} as const;
