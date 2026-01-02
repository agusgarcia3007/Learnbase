import { http } from "@/lib/http";

export type ConversationType = "learn" | "creator";

export type AdminConversation = {
  id: string;
  userId: string;
  type: ConversationType;
  title: string | null;
  metadata: {
    courseId?: string;
    courseTitle?: string;
    itemId?: string;
    itemTitle?: string;
    contextCourseIds?: string[];
  } | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
};

export type AdminConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: Array<
    | { type: "image"; key: string }
    | { type: "file"; data: string; mimeType: string; fileName?: string }
  > | null;
  toolInvocations: Array<{
    id: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
  }> | null;
  createdAt: string;
};

export type AdminConversationDetail = AdminConversation & {
  messages: AdminConversationMessage[];
};

export type AdminConversationsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  createdAt?: string;
  userId?: string;
  courseId?: string;
};

export type AdminConversationsAnalytics = {
  totalConversations: number;
  totalMessages: number;
  byType: {
    learn: number;
    creator: number;
  };
  dailyTrend: Array<{
    date: string;
    count: number;
  }>;
};

export const QUERY_KEYS = {
  ADMIN_CONVERSATIONS: ["admin-conversations"] as const,
  ADMIN_CONVERSATIONS_LIST: (params: AdminConversationsListParams) =>
    [...QUERY_KEYS.ADMIN_CONVERSATIONS, "list", params] as const,
  ADMIN_CONVERSATION: (id: string) =>
    [...QUERY_KEYS.ADMIN_CONVERSATIONS, id] as const,
  ADMIN_CONVERSATIONS_ANALYTICS: [
    ...["admin-conversations"],
    "analytics",
  ] as const,
};

export const AdminConversationsService = {
  list: async (params: AdminConversationsListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);
    if (params.userId) searchParams.set("userId", params.userId);
    if (params.courseId) searchParams.set("courseId", params.courseId);

    const query = searchParams.toString();
    const { data } = await http.get<{
      conversations: AdminConversation[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/ai/conversations/admin/list${query ? `?${query}` : ""}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await http.get<{
      conversation: AdminConversation;
      messages: AdminConversationMessage[];
    }>(`/ai/conversations/admin/${id}`);
    return data;
  },

  getAnalytics: async () => {
    const { data } = await http.get<AdminConversationsAnalytics>(
      "/ai/conversations/admin/analytics"
    );
    return data;
  },
};
