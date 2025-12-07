import { useQuery } from "@tanstack/react-query";
import {
  campusTenantOptions,
  campusCoursesOptions,
  campusCourseOptions,
  campusCategoriesOptions,
  campusStatsOptions,
  campusModuleItemsOptions,
} from "./options";
import type { CoursesListParams } from "./service";

export const useCampusTenant = () => useQuery(campusTenantOptions());

export const useCampusCourses = (params: CoursesListParams = {}) =>
  useQuery(campusCoursesOptions(params));

export const useCampusCourse = (slug: string) =>
  useQuery(campusCourseOptions(slug));

export const useCampusCategories = () => useQuery(campusCategoriesOptions());

export const useCampusStats = () => useQuery(campusStatsOptions());

export const useCampusModuleItems = (moduleId: string | null) =>
  useQuery({
    ...campusModuleItemsOptions(moduleId!),
    enabled: !!moduleId,
  });
