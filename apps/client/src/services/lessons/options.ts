import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import {
  LessonsService,
  QUERY_KEYS,
  type LessonListParams,
  type CreateLessonRequest,
  type UpdateLessonRequest,
  type UploadVideoRequest,
  type UploadFileRequest,
} from "./service";

export const lessonsListOptions = (params: LessonListParams = {}) =>
  queryOptions({
    queryFn: () => LessonsService.list(params),
    queryKey: QUERY_KEYS.LESSONS_LIST(params),
  });

export const lessonOptions = (id: string) =>
  queryOptions({
    queryFn: () => LessonsService.getById(id),
    queryKey: QUERY_KEYS.LESSON(id),
    enabled: !!id,
  });

export const createLessonOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateLessonRequest) => LessonsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LESSONS });
      toast.success(i18n.t("lessons.create.success"));
    },
  });
};

export const updateLessonOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateLessonRequest) =>
      LessonsService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LESSONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LESSON(id) });
      toast.success(i18n.t("lessons.edit.success"));
    },
  });
};

export const deleteLessonOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: LessonsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LESSONS });
      toast.success(i18n.t("lessons.delete.success"));
    },
  });
};

export const uploadVideoOptions = () =>
  useUploadMutation({
    mutationFn: (video: string) => LessonsService.upload(video),
  });

export const uploadFileOptions = () =>
  useUploadMutation({
    mutationFn: (payload: UploadFileRequest) =>
      LessonsService.uploadFileStandalone(payload),
  });

export const uploadLessonVideoOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UploadVideoRequest) =>
      LessonsService.uploadVideo(id, payload),
    invalidateKeys: ({ id }) => [QUERY_KEYS.LESSONS, QUERY_KEYS.LESSON(id)],
    successMessage: "lessons.video.uploadSuccess",
  });

export const deleteLessonVideoOptions = () =>
  useUploadMutation({
    mutationFn: LessonsService.deleteVideo,
    invalidateKeys: (_, data) => [
      QUERY_KEYS.LESSONS,
      QUERY_KEYS.LESSON(data.lesson.id),
    ],
    successMessage: "lessons.video.deleteSuccess",
  });

export const uploadLessonFileOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UploadFileRequest) =>
      LessonsService.uploadFile(id, payload),
    invalidateKeys: ({ id }) => [QUERY_KEYS.LESSONS, QUERY_KEYS.LESSON(id)],
    successMessage: "lessons.file.uploadSuccess",
  });

export const deleteLessonFileOptions = () =>
  useUploadMutation({
    mutationFn: LessonsService.deleteFile,
    invalidateKeys: (_, data) => [
      QUERY_KEYS.LESSONS,
      QUERY_KEYS.LESSON(data.lesson.id),
    ],
    successMessage: "lessons.file.deleteSuccess",
  });
