import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { EnrollmentsService, QUERY_KEYS, type CreateEnrollmentRequest } from "./service";

export function useAdminCreateEnrollment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateEnrollmentRequest) => EnrollmentsService.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ENROLLMENTS });
      toast.success(t("enrollmentsList.enroll.success"));
    },
  });
}

export function useAdminUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: { id: string; status: "active" | "cancelled" }) =>
      EnrollmentsService.adminUpdateStatus(data.id, data.status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ENROLLMENTS });
      const key = variables.status === "cancelled" ? "enrollmentsList.cancel.success" : "enrollmentsList.reactivate.success";
      toast.success(t(key));
    },
  });
}
