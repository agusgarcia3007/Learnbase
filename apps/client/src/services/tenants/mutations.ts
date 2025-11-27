import { useMutation } from "@tanstack/react-query";
import { createTenantOptions } from "./options";

export const useCreateTenant = () => useMutation(createTenantOptions());
