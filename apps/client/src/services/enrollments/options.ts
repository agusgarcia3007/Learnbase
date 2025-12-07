import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { EnrollmentsService, QUERY_KEYS } from "./service";

export const enrollmentsListOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.ENROLLMENTS,
    queryFn: () => EnrollmentsService.list(),
  });

export const enrollmentCheckOptions = (courseId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.ENROLLMENT(courseId),
    queryFn: () => EnrollmentsService.check(courseId),
    enabled: !!courseId,
  });

export const enrollOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: EnrollmentsService.enroll,
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ENROLLMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ENROLLMENT(courseId) });
      toast.success(i18n.t("enrollments.enrollSuccess"));
    },
  });
};

export const unenrollOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: EnrollmentsService.unenroll,
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ENROLLMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ENROLLMENT(courseId) });
      toast.success(i18n.t("enrollments.unenrollSuccess"));
    },
  });
};
