import { useMutation } from "@tanstack/react-query";
import {
  createCategoryOptions,
  updateCategoryOptions,
  deleteCategoryOptions,
} from "./options";

export const useCreateCategory = () => useMutation(createCategoryOptions());

export const useUpdateCategory = () => useMutation(updateCategoryOptions());

export const useDeleteCategory = () => useMutation(deleteCategoryOptions());
