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
  type UpdateModuleItemsRequest,
  type ModuleWithItems,
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

export const bulkDeleteModulesOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (ids: string[]) => ModulesService.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
      toast.success(i18n.t("modules.bulkDelete.success", { count: ids.length }));
    },
  });
};

export const updateModuleItemsOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateModuleItemsRequest) =>
      ModulesService.updateItems(id, payload),
    onMutate: async ({ id, items }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.MODULE(id) });

      const previousModule = queryClient.getQueryData<{ module: ModuleWithItems }>(
        QUERY_KEYS.MODULE(id)
      );

      if (previousModule) {
        const currentItems = previousModule.module.items;
        const itemMap = new Map(
          currentItems.map((mi) => [`${mi.contentType}:${mi.contentId}`, mi])
        );

        const updatedItems = items
          .map((item, index) => {
            const key = `${item.contentType}:${item.contentId}`;
            const existing = itemMap.get(key);
            if (existing) {
              return {
                ...existing,
                order: item.order ?? index,
                isPreview: item.isPreview ?? existing.isPreview,
              };
            }
            return null;
          })
          .filter(Boolean);

        queryClient.setQueryData(QUERY_KEYS.MODULE(id), {
          module: {
            ...previousModule.module,
            items: updatedItems,
            itemsCount: updatedItems.length,
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
      toast.error(i18n.t("modules.items.updateError"));
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULE(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODULES });
    },
  });
};
