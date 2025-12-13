import { queryOptions } from "@tanstack/react-query";
import {
  DashboardService,
  QUERY_KEYS,
  type TrendPeriod,
  type BackofficeCategoriesListParams,
  type BackofficeInstructorsListParams,
  type BackofficeVideosListParams,
  type BackofficeDocumentsListParams,
  type BackofficeEnrollmentsListParams,
  type BackofficeCertificatesListParams,
  type BackofficeWaitlistListParams,
} from "./service";

export const dashboardStatsOptions = queryOptions({
  queryFn: () => DashboardService.getStats(),
  queryKey: QUERY_KEYS.STATS,
});

export const trendsOptions = (period: TrendPeriod) =>
  queryOptions({
    queryFn: () => DashboardService.getTrends(period),
    queryKey: QUERY_KEYS.TRENDS(period),
  });

export const topCoursesOptions = (limit = 5) =>
  queryOptions({
    queryFn: () => DashboardService.getTopCourses(limit),
    queryKey: QUERY_KEYS.TOP_COURSES(limit),
  });

export const topTenantsOptions = (limit = 5) =>
  queryOptions({
    queryFn: () => DashboardService.getTopTenants(limit),
    queryKey: QUERY_KEYS.TOP_TENANTS(limit),
  });

export const backofficeCategoriesOptions = (
  params: BackofficeCategoriesListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getCategories(params),
    queryKey: QUERY_KEYS.CATEGORIES(params),
  });

export const backofficeInstructorsOptions = (
  params: BackofficeInstructorsListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getInstructors(params),
    queryKey: QUERY_KEYS.INSTRUCTORS(params),
  });

export const backofficeVideosOptions = (
  params: BackofficeVideosListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getVideos(params),
    queryKey: QUERY_KEYS.VIDEOS(params),
  });

export const backofficeDocumentsOptions = (
  params: BackofficeDocumentsListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getDocuments(params),
    queryKey: QUERY_KEYS.DOCUMENTS(params),
  });

export const backofficeEnrollmentsOptions = (
  params: BackofficeEnrollmentsListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getEnrollments(params),
    queryKey: QUERY_KEYS.ENROLLMENTS(params),
  });

export const backofficeCertificatesOptions = (
  params: BackofficeCertificatesListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getCertificates(params),
    queryKey: QUERY_KEYS.CERTIFICATES(params),
  });

export const backofficeWaitlistOptions = (
  params: BackofficeWaitlistListParams = {}
) =>
  queryOptions({
    queryFn: () => DashboardService.getWaitlist(params),
    queryKey: QUERY_KEYS.WAITLIST(params),
  });
