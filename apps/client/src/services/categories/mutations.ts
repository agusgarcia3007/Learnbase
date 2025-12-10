import { useMutation } from "@tanstack/react-query";
import {
  useCreateCategoryOptions,
  useUpdateCategoryOptions,
  useDeleteCategoryOptions,
} from "./options";

export const useCreateCategory = () => useMutation(useCreateCategoryOptions());

export const useUpdateCategory = () => useMutation(useUpdateCategoryOptions());

export const useDeleteCategory = () => useMutation(useDeleteCategoryOptions());
