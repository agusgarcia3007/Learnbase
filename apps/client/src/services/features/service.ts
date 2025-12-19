import { http } from "@/lib/http";

export type FeaturePriority = "low" | "medium" | "high" | "critical";
export type FeatureStatus = "pending" | "ideas" | "in_progress" | "shipped";

export type FeatureAttachment = {
  id: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  order: number;
  voteCount: number;
  userVote: 1 | -1 | null;
  submittedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  attachments: FeatureAttachment[];
  submittedById: string;
  approvedById: string | null;
  rejectedById: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureBoardResponse = {
  features: {
    ideas: Feature[];
    inProgress: Feature[];
    shipped: Feature[];
  };
};

export type FeatureListResponse = {
  features: Feature[];
};

export type SubmitFeatureRequest = {
  title: string;
  description: string;
  priority: FeaturePriority;
  attachmentKeys?: {
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
};

export type CreateFeatureDirectRequest = {
  title: string;
  description: string;
  priority: FeaturePriority;
  status?: "ideas" | "in_progress" | "shipped";
};

export type UpdateFeatureRequest = {
  title?: string;
  description?: string;
  priority?: FeaturePriority;
};

export type UpdateFeatureStatusRequest = {
  status: "ideas" | "in_progress" | "shipped";
  order?: number;
};

export type VoteRequest = {
  value: 1 | -1;
};

export type VoteResponse = {
  voteCount: number;
  userVote: 1 | -1 | null;
};

export const QUERY_KEYS = {
  FEATURES: ["features"],
  FEATURES_BOARD: ["features", "board"],
  FEATURES_PENDING: ["features", "pending"],
  FEATURE: (id: string) => ["features", id],
} as const;

export const FeaturesService = {
  async getBoard() {
    const { data } = await http.get<FeatureBoardResponse>("/features");
    return data;
  },

  async getPending() {
    const { data } = await http.get<FeatureListResponse>("/features/pending");
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ feature: Feature }>(`/features/${id}`);
    return data;
  },

  async submit(payload: SubmitFeatureRequest) {
    const { data } = await http.post<{ feature: Feature }>("/features", payload);
    return data;
  },

  async createDirect(payload: CreateFeatureDirectRequest) {
    const { data } = await http.post<{ feature: Feature }>("/features/direct", payload);
    return data;
  },

  async update(id: string, payload: UpdateFeatureRequest) {
    const { data } = await http.put<{ feature: Feature }>(`/features/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, payload: UpdateFeatureStatusRequest) {
    const { data } = await http.put<{ feature: Feature }>(`/features/${id}/status`, payload);
    return data;
  },

  async approve(id: string) {
    const { data } = await http.post<{ feature: Feature }>(`/features/${id}/approve`);
    return data;
  },

  async reject(id: string, reason?: string) {
    const { data } = await http.post<{ success: boolean }>(`/features/${id}/reject`, { reason });
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/features/${id}`);
    return data;
  },

  async vote(id: string, value: 1 | -1) {
    const { data } = await http.post<VoteResponse>(`/features/${id}/vote`, { value });
    return data;
  },

  async removeVote(id: string) {
    const { data } = await http.delete<VoteResponse>(`/features/${id}/vote`);
    return data;
  },
} as const;
