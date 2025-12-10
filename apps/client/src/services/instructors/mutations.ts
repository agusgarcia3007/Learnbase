import { useMutation } from "@tanstack/react-query";
import {
  useCreateInstructorOptions,
  useUpdateInstructorOptions,
  useDeleteInstructorOptions,
} from "./options";

export const useCreateInstructor = () => useMutation(useCreateInstructorOptions());

export const useUpdateInstructor = () => useMutation(useUpdateInstructorOptions());

export const useDeleteInstructor = () => useMutation(useDeleteInstructorOptions());
