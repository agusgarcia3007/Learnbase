import { useQuery } from "@tanstack/react-query";
import { enrollmentsListOptions, enrollmentCheckOptions } from "./options";

export const useEnrollments = () => useQuery(enrollmentsListOptions());

export const useEnrollmentCheck = (courseId: string) =>
  useQuery(enrollmentCheckOptions(courseId));
