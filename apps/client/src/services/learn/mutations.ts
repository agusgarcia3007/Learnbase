import { useMutation } from "@tanstack/react-query";
import { updateProgressOptions, completeItemOptions } from "./options";

export const useUpdateProgress = () => useMutation(updateProgressOptions());

export const useCompleteItem = (courseSlug: string) =>
  useMutation(completeItemOptions(courseSlug));
