import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { TenantsService, QUERY_KEYS } from "./service";

export const tenantsOptions = queryOptions({
  queryFn: TenantsService.list,
  queryKey: QUERY_KEYS.TENANTS,
});

export const tenantOptions = (slug: string) =>
  queryOptions({
    queryFn: () => TenantsService.getBySlug(slug),
    queryKey: QUERY_KEYS.TENANT(slug),
  });

export const createTenantOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: TenantsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
    },
  });
};
