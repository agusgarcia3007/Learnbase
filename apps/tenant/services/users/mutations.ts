import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { UsersService, QUERY_KEYS, type InviteUserRequest, type UpdateUserRequest } from "./service";

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: InviteUserRequest) => UsersService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(t("users.invite.success"));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => UsersService.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(t("users.edit.success"));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => UsersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(t("users.delete.success"));
    },
  });
}
