import { useMutation } from "@tanstack/react-query";
import {
  createVideoOptions,
  updateVideoOptions,
  deleteVideoOptions,
  uploadVideoFileOptions,
  deleteVideoFileOptions,
  uploadVideoStandaloneOptions,
} from "./options";

export const useCreateVideo = () => useMutation(createVideoOptions());

export const useUpdateVideo = () => useMutation(updateVideoOptions());

export const useDeleteVideo = () => useMutation(deleteVideoOptions());

export const useUploadVideoFile = () => useMutation(uploadVideoFileOptions());

export const useDeleteVideoFile = () => useMutation(deleteVideoFileOptions());

export const useUploadVideoStandalone = () => useMutation(uploadVideoStandaloneOptions());
