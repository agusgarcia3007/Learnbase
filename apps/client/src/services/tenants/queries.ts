import { useQuery } from "@tanstack/react-query";
import { tenantsOptions, tenantOptions } from "./options";

export const useGetTenants = () => useQuery(tenantsOptions);

export const useGetTenant = (slug: string) => useQuery(tenantOptions(slug));
