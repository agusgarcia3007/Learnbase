import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { LearnService, QUERY_KEYS } from "./service";
import type { UpdateProgressPayload } from "./service";

export const courseStructureOptions = (courseSlug: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.COURSE_STRUCTURE(courseSlug),
    queryFn: () => LearnService.getCourseStructure(courseSlug),
    enabled: !!courseSlug,
    staleTime: 5 * 60 * 1000,
  });

export const courseProgressOptions = (courseSlug: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.COURSE_PROGRESS(courseSlug),
    queryFn: () => LearnService.getCourseProgress(courseSlug),
    enabled: !!courseSlug,
    staleTime: 30 * 1000,
  });

export const moduleItemsOptions = (moduleId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.MODULE_ITEMS(moduleId),
    queryFn: () => LearnService.getModuleItems(moduleId),
    enabled: !!moduleId,
    staleTime: 30 * 1000,
  });

export const itemContentOptions = (moduleItemId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.ITEM_CONTENT(moduleItemId),
    queryFn: () => LearnService.getItemContent(moduleItemId),
    enabled: !!moduleItemId,
    staleTime: 30 * 1000,
  });

export const updateProgressOptions = () =>
  mutationOptions({
    mutationFn: ({
      moduleItemId,
      payload,
    }: {
      moduleItemId: string;
      payload: UpdateProgressPayload;
    }) => LearnService.updateProgress(moduleItemId, payload),
  });

export const completeItemOptions = () =>
  mutationOptions({
    mutationFn: (moduleItemId: string) =>
      LearnService.completeItem(moduleItemId),
  });

export const toggleItemCompleteOptions = () =>
  mutationOptions({
    mutationFn: (moduleItemId: string) =>
      LearnService.toggleItemComplete(moduleItemId),
  });

export const relatedCoursesOptions = (courseSlug: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.RELATED_COURSES(courseSlug),
    queryFn: () => LearnService.getRelatedCourses(courseSlug),
    enabled: !!courseSlug,
    staleTime: 5 * 60 * 1000,
  });
