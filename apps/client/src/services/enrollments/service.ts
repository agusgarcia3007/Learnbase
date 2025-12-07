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
} as const;

export const EnrollmentsService = {
  async list() {
    const { data } = await http.get<{ enrollments: Enrollment[] }>("/enrollments");
    return data;
  },

  async enroll(courseId: string) {
    const { data } = await http.post<{ enrollment: Enrollment }>("/enrollments", {
      courseId,
    });
    return data;
  },

  async check(courseId: string) {
    const { data } = await http.get<EnrollmentCheck>(`/enrollments/${courseId}`);
    return data;
  },

  async unenroll(courseId: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/enrollments/${courseId}`
    );
    return data;
  },
} as const;
