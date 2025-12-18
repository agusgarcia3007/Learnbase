"use client";

import { useQuery } from "@tanstack/react-query";
import { EnrollmentsService, QUERY_KEYS, type AdminEnrollmentListParams } from "./service";

export function useEnrollments() {
  return useQuery({
    queryKey: QUERY_KEYS.ENROLLMENTS,
    queryFn: () => EnrollmentsService.list(),
  });
}

export function useEnrollmentCheck(courseId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ENROLLMENT(courseId),
    queryFn: () => EnrollmentsService.check(courseId),
    enabled: !!courseId,
  });
}

export function useAdminEnrollments(params: AdminEnrollmentListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_ENROLLMENTS_LIST(params),
    queryFn: () => EnrollmentsService.adminList(params),
  });
}
