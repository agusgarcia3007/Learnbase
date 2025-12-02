import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  InstructorsService,
  QUERY_KEYS,
  type InstructorListParams,
  type CreateInstructorRequest,
  type UpdateInstructorRequest,
} from "./service";

export const instructorsListOptions = (params: InstructorListParams = {}) =>
  queryOptions({
    queryFn: () => InstructorsService.list(params),
    queryKey: QUERY_KEYS.INSTRUCTORS_LIST(params),
  });

export const instructorOptions = (id: string) =>
  queryOptions({
    queryFn: () => InstructorsService.getById(id),
    queryKey: QUERY_KEYS.INSTRUCTOR(id),
    enabled: !!id,
  });

export const createInstructorOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateInstructorRequest) =>
      InstructorsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      toast.success(i18n.t("instructors.create.success"));
    },
  });
};

export const updateInstructorOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateInstructorRequest) =>
      InstructorsService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR(id) });
      toast.success(i18n.t("instructors.edit.success"));
    },
  });
};

export const deleteInstructorOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: InstructorsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      toast.success(i18n.t("instructors.delete.success"));
    },
  });
};
