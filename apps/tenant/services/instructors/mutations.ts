import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { InstructorsService, QUERY_KEYS, type InviteInstructorRequest, type UpdateInstructorRequest } from "./service";

export function useInviteInstructor() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: InviteInstructorRequest) => InstructorsService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      toast.success(t("instructors.invite.success"));
    },
  });
}

export function useUpdateInstructor() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateInstructorRequest) => InstructorsService.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      toast.success(t("instructors.edit.success"));
    },
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => InstructorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      toast.success(t("instructors.delete.success"));
    },
  });
}
