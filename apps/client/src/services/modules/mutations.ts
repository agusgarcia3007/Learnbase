import { useMutation } from "@tanstack/react-query";
import {
  createModuleOptions,
  updateModuleOptions,
  deleteModuleOptions,
  updateModuleLessonsOptions,
} from "./options";

export const useCreateModule = () => useMutation(createModuleOptions());

export const useUpdateModule = () => useMutation(updateModuleOptions());

export const useDeleteModule = () => useMutation(deleteModuleOptions());

export const useUpdateModuleLessons = () => useMutation(updateModuleLessonsOptions());
