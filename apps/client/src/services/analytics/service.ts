import { publicHttp } from "@/lib/http";

const SESSION_KEY = "lms_session_id";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

function setSessionId(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, id);
}

export type VisitorStats = {
  total: number;
  pageViews: number;
  bounceRate: number;
  avgPagesPerVisit: number;
};

export type DailyVisitors = {
  date: string;
  count: number;
};

export type TopPage = {
  path: string;
  views: number;
};

export type VisitorAnalytics = {
  visitors: VisitorStats;
  dailyVisitors: DailyVisitors[];
  topPages: TopPage[];
};

export const analyticsService = {
  track(tenantSlug: string, path: string) {
    const sessionId = getSessionId();

    publicHttp
      .post<{ success: boolean; sessionId: string }>("/analytics/track", {
        tenantSlug,
        sessionId,
        path,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      })
      .then(({ data }) => {
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }
      })
      .catch(() => {});
  },

  async getVisitors(tenantId: string, period: string = "30d") {
    const { data } = await publicHttp.get<VisitorAnalytics>(
      `/analytics/tenants/${tenantId}/visitors?period=${period}`
    );
    return data;
  },
} as const;

export const ANALYTICS_QUERY_KEYS = {
  visitors: (tenantId: string, period: string) =>
    ["analytics", "visitors", tenantId, period] as const,
};
