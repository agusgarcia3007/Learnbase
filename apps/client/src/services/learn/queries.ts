import { useQuery } from "@tanstack/react-query";
import { courseStructureOptions, itemContentOptions } from "./options";

export const useCourseStructure = (courseSlug: string) =>
  useQuery(courseStructureOptions(courseSlug));

export const useItemContent = (moduleItemId: string) =>
  useQuery(itemContentOptions(moduleItemId));
