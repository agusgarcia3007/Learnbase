import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  UsersService,
  QUERY_KEYS,
  type UserListParams,
  type TenantUserListParams,
  type UpdateUserRequest,
} from "./service";

export const usersListOptions = (params: UserListParams = {}) =>
  queryOptions({
    queryFn: () => UsersService.list(params),
    queryKey: QUERY_KEYS.USERS_LIST(params),
  });

export const tenantUsersListOptions = (params: TenantUserListParams = {}) =>
  queryOptions({
    queryFn: () => UsersService.listTenantUsers(params),
    queryKey: QUERY_KEYS.TENANT_USERS_LIST(params),
  });

export const userOptions = (id: string) =>
  queryOptions({
    queryFn: () => UsersService.getById(id),
    queryKey: QUERY_KEYS.USER(id),
    enabled: !!id,
  });

export const useUpdateUserOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateUserRequest) =>
      UsersService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(id) });
      toast.success(i18n.t("backoffice.users.edit.success"));
    },
  });
};

export const useDeleteUserOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: UsersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(i18n.t("backoffice.users.delete.success"));
    },
  });
};
