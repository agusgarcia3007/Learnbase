import { useQuery } from "@tanstack/react-query";
import { coursesListOptions, courseOptions } from "./options";
import type { CourseListParams } from "./service";

export const useGetCourses = (params: CourseListParams = {}) =>
  useQuery(coursesListOptions(params));

export const useGetCourse = (id: string) => useQuery(courseOptions(id));
