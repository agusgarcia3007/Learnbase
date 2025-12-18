import { http } from "@/lib/http";

export type EnrollmentStatus = "active" | "completed" | "cancelled";

export type EnrolledCourseInstructor = {
  name: string;
  avatar: string | null;
};

export type EnrolledCourseCategory = {
  name: string;
  slug: string;
};

export type EnrolledCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  level: "beginner" | "intermediate" | "advanced";
  modulesCount: number;
  instructor: EnrolledCourseInstructor | null;
  category: EnrolledCourseCategory | null;
};

export type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  course: EnrolledCourse;
};

export type EnrollmentCheck = {
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    progress: number;
  } | null;
  isEnrolled: boolean;
};

export const QUERY_KEYS = {
  ENROLLMENTS: ["enrollments"] as const,
  ENROLLMENT: (courseId: string) => ["enrollments", courseId] as const,
  ADMIN_ENROLLMENTS: ["admin-enrollments"] as const,
  ADMIN_ENROLLMENTS_LIST: (params: AdminEnrollmentListParams) => ["admin-enrollments", "list", params] as const,
} as const;

export type AdminEnrollment = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
};

export type AdminEnrollmentListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
};

export type AdminEnrollmentListResponse = {
  enrollments: AdminEnrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateEnrollmentRequest = {
  userId: string;
  courseId: string;
};

export const EnrollmentsService = {
  async list() {
    const { data } = await http.get<{ enrollments: Enrollment[] }>("/enrollments");
    return data;
  },

  async enroll(courseId: string) {
    const { data } = await http.post<{ enrollment: Enrollment }>(`/enrollments/${courseId}`);
    return data;
  },

  async check(courseId: string) {
    const { data } = await http.get<EnrollmentCheck>(`/enrollments/check/${courseId}`);
    return data;
  },

  async adminList(params: AdminEnrollmentListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);

    const queryString = searchParams.toString();
    const url = queryString ? `/enrollments/admin?${queryString}` : "/enrollments/admin";
    const { data } = await http.get<AdminEnrollmentListResponse>(url);
    return data;
  },

  async adminCreate(payload: CreateEnrollmentRequest) {
    const { data } = await http.post<{ enrollment: AdminEnrollment }>("/enrollments/admin", payload);
    return data;
  },

  async adminUpdateStatus(id: string, status: "active" | "cancelled") {
    const { data } = await http.put<{ enrollment: AdminEnrollment }>(`/enrollments/admin/${id}/status`, { status });
    return data;
  },
} as const;
