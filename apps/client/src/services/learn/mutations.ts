import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProgressOptions, completeItemOptions } from "./options";
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
    },
  });
};
