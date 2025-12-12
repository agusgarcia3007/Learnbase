import { createServerFn } from "@tanstack/react-start";
import type { CampusTenant, CampusCourse, CampusCourseDetail, CampusStats } from "./service";

const API_URL = import.meta.env.VITE_API_URL;

type TenantResponse = { tenant: CampusTenant };
type CoursesResponse = { courses: CampusCourse[] };
type CourseResponse = { course: CampusCourseDetail };
type StatsResponse = { stats: CampusStats };

export const getCampusTenantServer = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data: { slug } }): Promise<TenantResponse> => {
    const response = await fetch(`${API_URL}/campus/tenant`, {
      headers: { "X-Tenant-Slug": slug },
    });
    return response.json();
  });

export const getCampusCoursesServer = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; limit?: number }) => d)
  .handler(async ({ data: { slug, limit = 8 } }): Promise<CoursesResponse> => {
    const response = await fetch(`${API_URL}/campus/courses?limit=${limit}`, {
      headers: { "X-Tenant-Slug": slug },
    });
    return response.json();
  });

export const getCampusStatsServer = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data: { slug } }): Promise<StatsResponse> => {
    const response = await fetch(`${API_URL}/campus/stats`, {
      headers: { "X-Tenant-Slug": slug },
    });
    return response.json();
  });

export const getCampusCourseServer = createServerFn({ method: "GET" })
  .inputValidator((d: { tenantSlug: string; courseSlug: string }) => d)
  .handler(async ({ data: { tenantSlug, courseSlug } }): Promise<CourseResponse | null> => {
    const response = await fetch(`${API_URL}/campus/courses/${courseSlug}`, {
      headers: { "X-Tenant-Slug": tenantSlug },
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  });
