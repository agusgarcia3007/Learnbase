import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  ModulesService,
  QUERY_KEYS,
  type ModuleListParams,
  type CreateModuleRequest,
  type UpdateModuleRequest,
  type UpdateModuleLessonsRequest,
  type ModuleWithLessons,
} from "./service";

export const modulesListOptions = (params: ModuleListParams = {}) =>
  queryOptions({
    queryFn: () => ModulesService.list(params),
    queryKey: QUERY_KEYS.MODULES_LIST(params),
  });

export const moduleOptions = (id: string) =>
  queryOptions({
    queryFn: () => ModulesService.getById(id),
    queryKey: QUERY_KEYS.MODULE(id),
    enabled: !!id,
  });

export const createModuleOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateModuleRequest) => ModulesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
      toast.success(i18n.t("modules.create.success"));
    },
  });
};

export const updateModuleOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateModuleRequest) =>
      ModulesService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULE(id) });
      toast.success(i18n.t("modules.edit.success"));
    },
  });
};

export const deleteModuleOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ModulesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
      toast.success(i18n.t("modules.delete.success"));
    },
  });
};

export const updateModuleLessonsOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateModuleLessonsRequest) =>
      ModulesService.updateLessons(id, payload),
    onMutate: async ({ id, lessons }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.MODULE(id) });

      const previousModule = queryClient.getQueryData<{ module: ModuleWithLessons }>(
        QUERY_KEYS.MODULE(id)
      );

      if (previousModule) {
        const currentLessons = previousModule.module.lessons;
        const lessonMap = new Map(currentLessons.map((ml) => [ml.lessonId, ml]));

        const updatedLessons = lessons
          .map((l, index) => {
            const existing = lessonMap.get(l.lessonId);
            if (existing) {
              return { ...existing, order: l.order ?? index };
            }
            return null;
          })
          .filter(Boolean);

        queryClient.setQueryData(QUERY_KEYS.MODULE(id), {
          module: {
            ...previousModule.module,
            lessons: updatedLessons,
            lessonsCount: updatedLessons.length,
          },
        });
      }

      return { previousModule };
    },
    onError: (_, variables, context) => {
      if (context?.previousModule) {
        queryClient.setQueryData(
          QUERY_KEYS.MODULE(variables.id),
          context.previousModule
        );
      }
      toast.error(i18n.t("modules.lessons.updateError"));
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULE(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
    },
  });
};
