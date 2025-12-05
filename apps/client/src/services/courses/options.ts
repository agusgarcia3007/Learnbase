import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import {
  CoursesService,
  QUERY_KEYS,
  type CourseListParams,
  type CreateCourseRequest,
  type UpdateCourseRequest,
  type UpdateCourseModulesRequest,
  type CourseWithModules,
} from "./service";

export const coursesListOptions = (params: CourseListParams = {}) =>
  queryOptions({
    queryFn: () => CoursesService.list(params),
    queryKey: QUERY_KEYS.COURSES_LIST(params),
  });

export const courseOptions = (id: string) =>
  queryOptions({
    queryFn: () => CoursesService.getById(id),
    queryKey: QUERY_KEYS.COURSE(id),
    enabled: !!id,
  });

export const createCourseOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateCourseRequest) => CoursesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
      toast.success(i18n.t("courses.create.success"));
    },
  });
};

export const updateCourseOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateCourseRequest) =>
      CoursesService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE(id) });
      toast.success(i18n.t("courses.edit.success"));
    },
  });
};

export const deleteCourseOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CoursesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
      toast.success(i18n.t("courses.delete.success"));
    },
  });
};

export const updateCourseModulesOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateCourseModulesRequest) =>
      CoursesService.updateModules(id, payload),
    onMutate: async ({ id, modules }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.COURSE(id) });

      const previousCourse = queryClient.getQueryData<{ course: CourseWithModules }>(
        QUERY_KEYS.COURSE(id)
      );

      if (previousCourse) {
        const currentModules = previousCourse.course.modules;
        const moduleMap = new Map(currentModules.map((cm) => [cm.moduleId, cm]));

        const updatedModules = modules
          .map((m, index) => {
            const existing = moduleMap.get(m.moduleId);
            if (existing) {
              return { ...existing, order: m.order ?? index };
            }
            return null;
          })
          .filter(Boolean);

        queryClient.setQueryData(QUERY_KEYS.COURSE(id), {
          course: {
            ...previousCourse.course,
            modules: updatedModules,
            modulesCount: updatedModules.length,
          },
        });
      }

      return { previousCourse };
    },
    onError: (_, variables, context) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(
          QUERY_KEYS.COURSE(variables.id),
          context.previousCourse
        );
      }
      toast.error(i18n.t("courses.modules.updateError"));
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
    },
  });
};

export const uploadThumbnailOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, thumbnail }: { id: string; thumbnail: string }) =>
      CoursesService.uploadThumbnail(id, thumbnail),
    invalidateKeys: ({ id }) => [QUERY_KEYS.COURSE(id), QUERY_KEYS.COURSES],
  });

export const deleteThumbnailOptions = () =>
  useUploadMutation({
    mutationFn: (id: string) => CoursesService.deleteThumbnail(id),
    invalidateKeys: (id) => [QUERY_KEYS.COURSE(id), QUERY_KEYS.COURSES],
  });

export const uploadVideoOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, video }: { id: string; video: string }) =>
      CoursesService.uploadVideo(id, video),
    invalidateKeys: ({ id }) => [QUERY_KEYS.COURSE(id), QUERY_KEYS.COURSES],
  });

export const deleteVideoOptions = () =>
  useUploadMutation({
    mutationFn: (id: string) => CoursesService.deleteVideo(id),
    invalidateKeys: (id) => [QUERY_KEYS.COURSE(id), QUERY_KEYS.COURSES],
  });
