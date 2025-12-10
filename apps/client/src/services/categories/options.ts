import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  CategoriesService,
  QUERY_KEYS,
  type CategoryListParams,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from "./service";

export const categoriesListOptions = (params: CategoryListParams = {}) =>
  queryOptions({
    queryFn: () => CategoriesService.list(params),
    queryKey: QUERY_KEYS.CATEGORIES_LIST(params),
  });

export const categoryOptions = (id: string) =>
  queryOptions({
    queryFn: () => CategoriesService.getById(id),
    queryKey: QUERY_KEYS.CATEGORY(id),
    enabled: !!id,
  });

export const useCreateCategoryOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateCategoryRequest) =>
      CategoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      toast.success(i18n.t("categories.create.success"));
    },
  });
};

export const useUpdateCategoryOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateCategoryRequest) =>
      CategoriesService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORY(id) });
      toast.success(i18n.t("categories.edit.success"));
    },
  });
};

export const useDeleteCategoryOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CategoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      toast.success(i18n.t("categories.delete.success"));
    },
  });
};
