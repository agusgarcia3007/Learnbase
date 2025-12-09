import { useMutation } from "@tanstack/react-query";
import {
  createModuleOptions,
  updateModuleOptions,
  deleteModuleOptions,
  bulkDeleteModulesOptions,
  updateModuleItemsOptions,
} from "./options";

export const useCreateModule = () => useMutation(createModuleOptions());

export const useUpdateModule = () => useMutation(updateModuleOptions());

export const useDeleteModule = () => useMutation(deleteModuleOptions());

export const useBulkDeleteModules = () => useMutation(bulkDeleteModulesOptions());

export const useUpdateModuleItems = () => useMutation(updateModuleItemsOptions());
