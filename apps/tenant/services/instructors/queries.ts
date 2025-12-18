import { useQuery } from "@tanstack/react-query";
import { InstructorsService, QUERY_KEYS, type InstructorListParams } from "./service";

export function useInstructors(params: InstructorListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.INSTRUCTORS_LIST(params),
    queryFn: () => InstructorsService.list(params),
  });
}
