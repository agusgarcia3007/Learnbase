import { http } from "@/lib/http";

export type FileType =
  | "video"
  | "document"
  | "avatar"
  | "logo"
  | "favicon"
  | "certificate";

export type S3File = {
  key: string;
  type: FileType;
  size: number | null;
  url: string;
  createdAt: string;
  metadata: {
    id: string;
    title?: string;
    fileName?: string;
    userName?: string;
    courseName?: string;
  };
};

export type FileSummary = {
  totalFiles: number;
  byType: {
    videos: number;
    documents: number;
    avatars: number;
    logos: number;
    favicons: number;
    certificates: number;
  };
  estimatedStorageBytes: number;
};

export type FilesResponse = {
  files: S3File[];
  summary: FileSummary;
};

export type BackofficeTenant = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | "cancelled";
  maxUsers: number | null;
  maxCourses: number | null;
  maxStorageBytes: string | null;
  features: {
    analytics?: boolean;
    certificates?: boolean;
    customDomain?: boolean;
    aiAnalysis?: boolean;
    whiteLabel?: boolean;
  } | null;
  createdAt: string;
  usersCount: number;
  coursesCount: number;
};

export type TenantsResponse = {
  tenants: BackofficeTenant[];
};

export const QUERY_KEYS = {
  files: (tenantId: string, type?: string) =>
    ["backoffice", "files", tenantId, type] as const,
  tenants: () => ["backoffice", "tenants"] as const,
};

export async function getBackofficeFiles(
  tenantId: string,
  type?: string
): Promise<FilesResponse> {
  const params = new URLSearchParams({ tenantId });
  if (type) params.append("type", type);
  const { data } = await http.get<FilesResponse>(
    `/backoffice/files?${params.toString()}`
  );
  return data;
}

export async function getBackofficeTenants(): Promise<TenantsResponse> {
  const { data } = await http.get<TenantsResponse>("/backoffice/tenants");
  return data;
}

export type UpdateTenantRequest = {
  maxUsers?: number | null;
  maxCourses?: number | null;
  maxStorageBytes?: string | null;
  features?: {
    analytics?: boolean;
    certificates?: boolean;
    customDomain?: boolean;
    aiAnalysis?: boolean;
    whiteLabel?: boolean;
  } | null;
  status?: "active" | "suspended" | "cancelled";
};

export async function updateBackofficeTenant(
  id: string,
  payload: UpdateTenantRequest
): Promise<{ tenant: BackofficeTenant }> {
  const { data } = await http.put<{ tenant: BackofficeTenant }>(
    `/backoffice/tenants/${id}`,
    payload
  );
  return data;
}

export type ManualUploadRequest = {
  base64: string;
  key: string;
};

export type ManualUploadResponse = {
  key: string;
  url: string;
};

export async function uploadBackofficeFile(
  payload: ManualUploadRequest
): Promise<ManualUploadResponse> {
  const { data } = await http.post<ManualUploadResponse>(
    "/backoffice/files/upload",
    payload
  );
  return data;
}
