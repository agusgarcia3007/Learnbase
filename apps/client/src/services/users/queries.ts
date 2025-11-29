import { useQuery } from "@tanstack/react-query";
import { usersListOptions, userOptions, tenantUsersListOptions } from "./options";
import type { UserListParams, TenantUserListParams } from "./service";

export const useGetUsers = (params: UserListParams = {}) =>
  useQuery(usersListOptions(params));

export const useGetUser = (id: string) => useQuery(userOptions(id));

export const useGetTenantUsers = (params: TenantUserListParams = {}) =>
  useQuery(tenantUsersListOptions(params));
