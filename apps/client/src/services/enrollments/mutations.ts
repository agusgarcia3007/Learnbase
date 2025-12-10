import { useMutation } from "@tanstack/react-query";
import { useEnrollOptions, useUnenrollOptions } from "./options";

export const useEnroll = () => useMutation(useEnrollOptions());

export const useUnenroll = () => useMutation(useUnenrollOptions());
