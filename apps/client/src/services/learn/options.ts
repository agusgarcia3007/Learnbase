import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { LearnService, QUERY_KEYS } from "./service";
import type { UpdateProgressPayload } from "./service";

export const courseStructureOptions = (courseSlug: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.COURSE_STRUCTURE(courseSlug),
    queryFn: () => LearnService.getCourseStructure(courseSlug),
    enabled: !!courseSlug,
  });

export const itemContentOptions = (moduleItemId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.ITEM_CONTENT(moduleItemId),
    queryFn: () => LearnService.getItemContent(moduleItemId),
    enabled: !!moduleItemId,
  });

export const updateProgressOptions = () =>
  mutationOptions({
    mutationFn: ({
      moduleItemId,
      payload,
    }: {
      moduleItemId: string;
      payload: UpdateProgressPayload;
    }) => LearnService.updateProgress(moduleItemId, payload),
  });

export const completeItemOptions = (courseSlug: string) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (moduleItemId: string) => LearnService.completeItem(moduleItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_STRUCTURE(courseSlug),
      });
    },
  });
};
