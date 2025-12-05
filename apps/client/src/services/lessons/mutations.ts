import { useMutation } from "@tanstack/react-query";
import {
  createLessonOptions,
  updateLessonOptions,
  deleteLessonOptions,
  uploadVideoOptions,
  uploadFileOptions,
  uploadLessonVideoOptions,
  deleteLessonVideoOptions,
  uploadLessonFileOptions,
  deleteLessonFileOptions,
} from "./options";

export const useCreateLesson = () => useMutation(createLessonOptions());

export const useUpdateLesson = () => useMutation(updateLessonOptions());

export const useDeleteLesson = () => useMutation(deleteLessonOptions());

export const useUploadVideo = () => useMutation(uploadVideoOptions());

export const useUploadFile = () => useMutation(uploadFileOptions());

export const useUploadLessonVideo = () => useMutation(uploadLessonVideoOptions());

export const useDeleteLessonVideo = () => useMutation(deleteLessonVideoOptions());

export const useUploadLessonFile = () => useMutation(uploadLessonFileOptions());

export const useDeleteLessonFile = () => useMutation(deleteLessonFileOptions());
