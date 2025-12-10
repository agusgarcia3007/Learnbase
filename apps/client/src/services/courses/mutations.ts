import { useMutation } from "@tanstack/react-query";
import {
  useCreateCourseOptions,
  useUpdateCourseOptions,
  useDeleteCourseOptions,
  useUpdateCourseModulesOptions,
  useUploadThumbnailOptions,
  useDeleteThumbnailOptions,
  useUploadCourseVideoOptions,
  useDeleteCourseVideoOptions,
} from "./options";

export const useCreateCourse = () => useMutation(useCreateCourseOptions());

export const useUpdateCourse = () => useMutation(useUpdateCourseOptions());

export const useDeleteCourse = () => useMutation(useDeleteCourseOptions());

export const useUpdateCourseModules = () => useMutation(useUpdateCourseModulesOptions());

export const useUploadThumbnail = () => useMutation(useUploadThumbnailOptions());

export const useDeleteThumbnail = () => useMutation(useDeleteThumbnailOptions());

export const useUploadVideo = () => useMutation(useUploadCourseVideoOptions());

export const useDeleteVideo = () => useMutation(useDeleteCourseVideoOptions());
