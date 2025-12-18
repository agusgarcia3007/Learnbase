import { useQuery } from "@tanstack/react-query";
import { UsersService, QUERY_KEYS, type UserListParams } from "./service";

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS_LIST(params),
    queryFn: () => UsersService.list(params),
  });
}
