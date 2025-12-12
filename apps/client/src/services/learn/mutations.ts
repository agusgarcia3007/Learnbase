import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProgressOptions, completeItemOptions, toggleItemCompleteOptions } from "./options";
import { QUERY_KEYS } from "./service";

export const useUpdateProgress = () => useMutation(updateProgressOptions());

export const useCompleteItem = (courseSlug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...completeItemOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_STRUCTURE(courseSlug),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_PROGRESS(courseSlug),
      });
    },
  });
};

export const useToggleItemComplete = (courseSlug: string, moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...toggleItemCompleteOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_STRUCTURE(courseSlug),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_PROGRESS(courseSlug),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MODULE_ITEMS(moduleId),
      });
    },
  });
};
