import { useMutation } from "@tanstack/react-query";
import { enrollOptions, unenrollOptions } from "./options";

export const useEnroll = () => useMutation(enrollOptions());

export const useUnenroll = () => useMutation(unenrollOptions());
