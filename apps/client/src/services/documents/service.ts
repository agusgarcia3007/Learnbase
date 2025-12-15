import { http } from "@/lib/http";

export type ContentStatus = "draft" | "published";

export type Document = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  fileUrl: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type DocumentListParams = {
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

export type CreateDocumentRequest = {
  title: string;
  description?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status?: ContentStatus;
};

export type UpdateDocumentRequest = {
  title?: string;
  description?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  status?: ContentStatus;
};


export type UploadFileResponse = {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export const QUERY_KEYS = {
  DOCUMENTS: ["documents"],
  DOCUMENTS_LIST: (params?: DocumentListParams) => ["documents", "list", params ?? {}],
  DOCUMENT: (id: string) => ["documents", id],
} as const;

export const DocumentsService = {
  async list(params: DocumentListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/documents?${queryString}` : "/documents";
    const { data } = await http.get<{ documents: Document[]; pagination: PaginationMeta }>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ document: Document }>(`/documents/${id}`);
    return data;
  },

  async create(payload: CreateDocumentRequest) {
    const { data } = await http.post<{ document: Document }>("/documents", payload);
    return data;
  },

  async update(id: string, payload: UpdateDocumentRequest) {
    const { data } = await http.put<{ document: Document }>(`/documents/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/documents/${id}`);
    return data;
  },

  async upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await http.post<UploadFileResponse>("/documents/upload", formData);
    return data;
  },

  async uploadFile(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await http.post<{ document: Document }>(`/documents/${id}/file`, formData);
    return data;
  },

  async deleteFile(id: string) {
    const { data } = await http.delete<{ document: Document }>(`/documents/${id}/file`);
    return data;
  },
} as const;
