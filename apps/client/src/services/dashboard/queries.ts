import { useQuery } from "@tanstack/react-query";
import {
  dashboardStatsOptions,
  trendsOptions,
  topCoursesOptions,
  topTenantsOptions,
  backofficeCategoriesOptions,
  backofficeInstructorsOptions,
  backofficeVideosOptions,
  backofficeDocumentsOptions,
  backofficeEnrollmentsOptions,
  backofficeCertificatesOptions,
  backofficeWaitlistOptions,
} from "./options";
import type {
  TrendPeriod,
  BackofficeCategoriesListParams,
  BackofficeInstructorsListParams,
  BackofficeVideosListParams,
  BackofficeDocumentsListParams,
  BackofficeEnrollmentsListParams,
  BackofficeCertificatesListParams,
  BackofficeWaitlistListParams,
} from "./service";

export const useGetDashboardStats = () => useQuery(dashboardStatsOptions);

export const useGetTrends = (period: TrendPeriod = "30d") =>
  useQuery(trendsOptions(period));

export const useGetTopCourses = (limit = 5) =>
  useQuery(topCoursesOptions(limit));

export const useGetTopTenants = (limit = 5) =>
  useQuery(topTenantsOptions(limit));

export const useGetBackofficeCategories = (
  params: BackofficeCategoriesListParams = {}
) => useQuery(backofficeCategoriesOptions(params));

export const useGetBackofficeInstructors = (
  params: BackofficeInstructorsListParams = {}
) => useQuery(backofficeInstructorsOptions(params));

export const useGetBackofficeVideos = (
  params: BackofficeVideosListParams = {}
) => useQuery(backofficeVideosOptions(params));

export const useGetBackofficeDocuments = (
  params: BackofficeDocumentsListParams = {}
) => useQuery(backofficeDocumentsOptions(params));

export const useGetBackofficeEnrollments = (
  params: BackofficeEnrollmentsListParams = {}
) => useQuery(backofficeEnrollmentsOptions(params));

export const useGetBackofficeCertificates = (
  params: BackofficeCertificatesListParams = {}
) => useQuery(backofficeCertificatesOptions(params));

export const useGetBackofficeWaitlist = (
  params: BackofficeWaitlistListParams = {}
) => useQuery(backofficeWaitlistOptions(params));
