import { useMutation } from "@tanstack/react-query";
import {
  useCreateVideoOptions,
  useUpdateVideoOptions,
  useDeleteVideoOptions,
  useUploadVideoFileOptions,
  useDeleteVideoFileOptions,
  useUploadVideoStandaloneOptions,
} from "./options";

export const useCreateVideo = () => useMutation(useCreateVideoOptions());

export const useUpdateVideo = () => useMutation(useUpdateVideoOptions());

export const useDeleteVideo = () => useMutation(useDeleteVideoOptions());

export const useUploadVideoFile = () => useMutation(useUploadVideoFileOptions());

export const useDeleteVideoFile = () => useMutation(useDeleteVideoFileOptions());

export const useUploadVideoStandalone = () => useMutation(useUploadVideoStandaloneOptions());
