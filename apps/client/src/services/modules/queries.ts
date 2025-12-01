import { useQuery } from "@tanstack/react-query";
import { modulesListOptions, moduleOptions } from "./options";
import type { ModuleListParams } from "./service";

export const useGetModules = (params: ModuleListParams = {}) =>
  useQuery(modulesListOptions(params));

export const useGetModule = (id: string) => useQuery(moduleOptions(id));
