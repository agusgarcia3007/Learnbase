import { useQuery } from "@tanstack/react-query";
import { instructorsListOptions, instructorOptions } from "./options";
import type { InstructorListParams } from "./service";

export const useGetInstructors = (params: InstructorListParams = {}) =>
  useQuery(instructorsListOptions(params));

export const useGetInstructor = (id: string) => useQuery(instructorOptions(id));
