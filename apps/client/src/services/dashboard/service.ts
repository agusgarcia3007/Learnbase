import { http } from "@/lib/http";

export type OverviewStats = {
  totalUsers: number;
  totalTenants: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  activeUsers30d: number;
};

export type GrowthStats = {
  usersChange: number;
  tenantsChange: number;
  enrollmentsChange: number;
};

export type RevenueStats = {
  total: number;
  avgCoursePrice: number;
};

export type EngagementStats = {
  avgCompletionRate: number;
  activeEnrollments: number;
  completedEnrollments: number;
};

export type DashboardStats = {
  overview: OverviewStats;
  growth: GrowthStats;
  revenue: RevenueStats;
  engagement: EngagementStats;
};

export type TrendDataPoint = {
  date: string;
  count: number;
};

export type TrendsData = {
  userGrowth: TrendDataPoint[];
  enrollmentGrowth: TrendDataPoint[];
  certificatesIssued: TrendDataPoint[];
  period: string;
};

export type TopCourse = {
  id: string;
  title: string;
  tenantName: string | null;
  enrollments: number;
  completionRate: number;
  revenue: number;
};

export type TopTenant = {
  id: string;
  name: string;
  slug: string;
  usersCount: number;
  coursesCount: number;
  enrollmentsCount: number;
};

export type TrendPeriod = "7d" | "30d" | "90d";

export type TenantRef = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type SocialLinks = {
  twitter?: string;
  linkedin?: string;
  github?: string;
};

export type BackofficeCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  tenantId: string | null;
  tenant: TenantRef | null;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BackofficeInstructor = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  title: string | null;
  email: string | null;
  website: string | null;
  socialLinks: SocialLinks | null;
  order: number;
  tenantId: string | null;
  tenant: TenantRef | null;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BackofficeCategoriesListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  tenantId?: string;
  createdAt?: string;
};

export type BackofficeInstructorsListParams = BackofficeCategoriesListParams;

export type ContentStatus = "draft" | "published";

export type BackofficeVideo = {
  id: string;
  title: string;
  description: string | null;
  videoKey: string | null;
  videoUrl: string | null;
  duration: number;
  status: ContentStatus;
  tenantId: string | null;
  tenant: TenantRef | null;
  createdAt: string;
  updatedAt: string;
};

export type BackofficeDocument = {
  id: string;
  title: string;
  description: string | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: ContentStatus;
  tenantId: string | null;
  tenant: TenantRef | null;
  createdAt: string;
  updatedAt: string;
};

export type BackofficeVideosListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  tenantId?: string;
  status?: ContentStatus;
  createdAt?: string;
};

export type BackofficeDocumentsListParams = BackofficeVideosListParams;

export type EnrollmentStatus = "active" | "completed" | "cancelled";

export type UserRef = {
  id: string;
  name: string | null;
  email: string | null;
};

export type CourseRef = {
  id: string;
  title: string | null;
};

export type BackofficeEnrollment = {
  id: string;
  userId: string | null;
  user: UserRef | null;
  courseId: string | null;
  course: CourseRef | null;
  tenantId: string | null;
  tenant: TenantRef | null;
  status: EnrollmentStatus;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackofficeCertificate = {
  id: string;
  verificationCode: string;
  imageKey: string | null;
  imageUrl: string | null;
  userName: string;
  courseName: string;
  userId: string;
  courseId: string;
  tenantId: string | null;
  tenant: TenantRef | null;
  issuedAt: string;
  createdAt: string;
};

export type BackofficeEnrollmentsListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  tenantId?: string;
  status?: EnrollmentStatus;
  createdAt?: string;
};

export type BackofficeCertificatesListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  tenantId?: string;
  issuedAt?: string;
};

export type BackofficeWaitlistEntry = {
  id: string;
  email: string;
  createdAt: string;
};

export type BackofficeWaitlistListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  createdAt?: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const QUERY_KEYS = {
  STATS: ["backoffice", "stats"],
  TRENDS: (period: TrendPeriod) => ["backoffice", "trends", period],
  TOP_COURSES: (limit: number) => ["backoffice", "top-courses", limit],
  TOP_TENANTS: (limit: number) => ["backoffice", "top-tenants", limit],
  CATEGORIES: (params: BackofficeCategoriesListParams) => [
    "backoffice",
    "categories",
    params,
  ],
  INSTRUCTORS: (params: BackofficeInstructorsListParams) => [
    "backoffice",
    "instructors",
    params,
  ],
  VIDEOS: (params: BackofficeVideosListParams) => [
    "backoffice",
    "videos",
    params,
  ],
  DOCUMENTS: (params: BackofficeDocumentsListParams) => [
    "backoffice",
    "documents",
    params,
  ],
  ENROLLMENTS: (params: BackofficeEnrollmentsListParams) => [
    "backoffice",
    "enrollments",
    params,
  ],
  CERTIFICATES: (params: BackofficeCertificatesListParams) => [
    "backoffice",
    "certificates",
    params,
  ],
  WAITLIST: (params: BackofficeWaitlistListParams) => [
    "backoffice",
    "waitlist",
    params,
  ],
} as const;

export const DashboardService = {
  async getStats() {
    const { data } = await http.get<{ stats: DashboardStats }>(
      "/backoffice/stats"
    );
    return data;
  },

  async getTrends(period: TrendPeriod = "30d") {
    const { data } = await http.get<{ trends: TrendsData }>(
      `/backoffice/stats/trends?period=${period}`
    );
    return data;
  },

  async getTopCourses(limit = 5) {
    const { data } = await http.get<{ courses: TopCourse[] }>(
      `/backoffice/stats/top-courses?limit=${limit}`
    );
    return data;
  },

  async getTopTenants(limit = 5) {
    const { data } = await http.get<{ tenants: TopTenant[] }>(
      `/backoffice/stats/top-tenants?limit=${limit}`
    );
    return data;
  },

  async getCategories(params: BackofficeCategoriesListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      categories: BackofficeCategory[];
      pagination: PaginationInfo;
    }>(`/backoffice/categories${query ? `?${query}` : ""}`);
    return data;
  },

  async getInstructors(params: BackofficeInstructorsListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      instructors: BackofficeInstructor[];
      pagination: PaginationInfo;
    }>(`/backoffice/instructors${query ? `?${query}` : ""}`);
    return data;
  },

  async getVideos(params: BackofficeVideosListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      videos: BackofficeVideo[];
      pagination: PaginationInfo;
    }>(`/backoffice/videos${query ? `?${query}` : ""}`);
    return data;
  },

  async getDocuments(params: BackofficeDocumentsListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      documents: BackofficeDocument[];
      pagination: PaginationInfo;
    }>(`/backoffice/documents${query ? `?${query}` : ""}`);
    return data;
  },

  async getEnrollments(params: BackofficeEnrollmentsListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      enrollments: BackofficeEnrollment[];
      pagination: PaginationInfo;
    }>(`/backoffice/enrollments${query ? `?${query}` : ""}`);
    return data;
  },

  async getCertificates(params: BackofficeCertificatesListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.tenantId) searchParams.set("tenantId", params.tenantId);
    if (params.issuedAt) searchParams.set("issuedAt", params.issuedAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      certificates: BackofficeCertificate[];
      pagination: PaginationInfo;
    }>(`/backoffice/certificates${query ? `?${query}` : ""}`);
    return data;
  },

  async getWaitlist(params: BackofficeWaitlistListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const query = searchParams.toString();
    const { data } = await http.get<{
      waitlist: BackofficeWaitlistEntry[];
      pagination: PaginationInfo;
    }>(`/backoffice/waitlist${query ? `?${query}` : ""}`);
    return data;
  },
} as const;
