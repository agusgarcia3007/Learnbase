import { http } from "@/lib/http";

export type CampusTenant = {
  id: string;
  name: string;
  slug: string;
};

export type CampusInstructor = {
  name: string;
  avatar: string | null;
  title: string | null;
  bio: string | null;
};

export type CampusCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  previewVideoUrl: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  tags: string[];
  features: string[];
  requirements: string[];
  objectives: string[];
  modulesCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  category: string | null;
  categoryName: string | null;
  instructor: CampusInstructor | null;
};

export type CampusCourseModule = {
  id: string;
  title: string;
  description: string | null;
  lessonsCount: number;
  order: number;
};

export type CampusCourseDetail = CampusCourse & {
  lessonsCount: number;
  modules: CampusCourseModule[];
};

export type CampusCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CampusStats = {
  totalCourses: number;
  totalStudents: number;
  categories: number;
};

export type CoursesListParams = {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
};

export type PaginationResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CoursesListResponse = {
  courses: CampusCourse[];
  pagination: PaginationResult;
};

export const QUERY_KEYS = {
  CAMPUS: ["campus"],
  TENANT: ["campus", "tenant"],
  COURSES: ["campus", "courses"],
  COURSES_LIST: (params: CoursesListParams) => ["campus", "courses", "list", params],
  COURSE: (slug: string) => ["campus", "courses", slug],
  CATEGORIES: ["campus", "categories"],
  STATS: ["campus", "stats"],
} as const;

export const CampusService = {
  async getTenant() {
    const { data } = await http.get<{ tenant: CampusTenant }>("/campus/tenant");
    return data;
  },

  async listCourses(params: CoursesListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.category) searchParams.set("category", params.category);
    if (params.level) searchParams.set("level", params.level);
    if (params.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const url = query ? `/campus/courses?${query}` : "/campus/courses";
    const { data } = await http.get<CoursesListResponse>(url);
    return data;
  },

  async getCourse(slug: string) {
    const { data } = await http.get<{ course: CampusCourseDetail }>(`/campus/courses/${slug}`);
    return data;
  },

  async getCategories() {
    const { data } = await http.get<{ categories: CampusCategory[] }>("/campus/categories");
    return data;
  },

  async getStats() {
    const { data } = await http.get<{ stats: CampusStats }>("/campus/stats");
    return data;
  },
} as const;
