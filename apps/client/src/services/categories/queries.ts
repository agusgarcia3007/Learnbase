import { useQuery } from "@tanstack/react-query";
import { categoriesListOptions, categoryOptions } from "./options";
import type { CategoryListParams } from "./service";

export const useGetCategories = (params: CategoryListParams = {}) =>
  useQuery(categoriesListOptions(params));

export const useGetCategory = (id: string) => useQuery(categoryOptions(id));
