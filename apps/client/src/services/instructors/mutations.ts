import { useMutation } from "@tanstack/react-query";
import {
  createInstructorOptions,
  updateInstructorOptions,
  deleteInstructorOptions,
} from "./options";

export const useCreateInstructor = () => useMutation(createInstructorOptions());

export const useUpdateInstructor = () => useMutation(updateInstructorOptions());

export const useDeleteInstructor = () => useMutation(deleteInstructorOptions());
