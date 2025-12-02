import { useMutation } from "@tanstack/react-query";
import {
  createCourseOptions,
  updateCourseOptions,
  deleteCourseOptions,
  updateCourseModulesOptions,
} from "./options";

export const useCreateCourse = () => useMutation(createCourseOptions());

export const useUpdateCourse = () => useMutation(updateCourseOptions());

export const useDeleteCourse = () => useMutation(deleteCourseOptions());

export const useUpdateCourseModules = () => useMutation(updateCourseModulesOptions());
