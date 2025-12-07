import { queryOptions } from "@tanstack/react-query";
import { CampusService, QUERY_KEYS, type CoursesListParams } from "./service";

export const campusTenantOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.TENANT,
    queryFn: () => CampusService.getTenant(),
  });

export const campusCoursesOptions = (params: CoursesListParams = {}) =>
  queryOptions({
    queryKey: QUERY_KEYS.COURSES_LIST(params),
    queryFn: () => CampusService.listCourses(params),
  });

export const campusCourseOptions = (slug: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.COURSE(slug),
    queryFn: () => CampusService.getCourse(slug),
    enabled: !!slug,
  });

export const campusCategoriesOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => CampusService.getCategories(),
  });

export const campusStatsOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.STATS,
    queryFn: () => CampusService.getStats(),
  });

export const campusModuleItemsOptions = (moduleId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.MODULE_ITEMS(moduleId),
    queryFn: () => CampusService.getModuleItems(moduleId),
    enabled: !!moduleId,
  });
