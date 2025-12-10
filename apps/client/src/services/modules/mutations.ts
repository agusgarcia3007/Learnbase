import { useMutation } from "@tanstack/react-query";
import {
  useCreateModuleOptions,
  useUpdateModuleOptions,
  useDeleteModuleOptions,
  useBulkDeleteModulesOptions,
  useUpdateModuleItemsOptions,
} from "./options";

export const useCreateModule = () => useMutation(useCreateModuleOptions());

export const useUpdateModule = () => useMutation(useUpdateModuleOptions());

export const useDeleteModule = () => useMutation(useDeleteModuleOptions());

export const useBulkDeleteModules = () => useMutation(useBulkDeleteModulesOptions());

export const useUpdateModuleItems = () => useMutation(useUpdateModuleItemsOptions());
