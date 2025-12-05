import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import {
  VideosService,
  QUERY_KEYS,
  type VideoListParams,
  type CreateVideoRequest,
  type UpdateVideoRequest,
} from "./service";

export const videosListOptions = (params?: VideoListParams) =>
  queryOptions({
    queryFn: () => VideosService.list(params),
    queryKey: QUERY_KEYS.VIDEOS_LIST(params),
  });

export const videoOptions = (id: string) =>
  queryOptions({
    queryFn: () => VideosService.getById(id),
    queryKey: QUERY_KEYS.VIDEO(id),
    enabled: !!id,
  });

export const createVideoOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateVideoRequest) => VideosService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VIDEOS });
      toast.success(i18n.t("videos.createSuccess"));
    },
  });
};

export const updateVideoOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateVideoRequest) =>
      VideosService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VIDEOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VIDEO(id) });
      toast.success(i18n.t("videos.updateSuccess"));
    },
  });
};

export const deleteVideoOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => VideosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VIDEOS });
      toast.success(i18n.t("videos.deleteSuccess"));
    },
  });
};

export const uploadVideoFileOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, video, duration }: { id: string; video: string; duration?: number }) =>
      VideosService.uploadVideo(id, video, duration),
    invalidateKeys: (payload) => [QUERY_KEYS.VIDEOS, QUERY_KEYS.VIDEO(payload.id)],
    successMessage: "videos.uploadSuccess",
  });

export const deleteVideoFileOptions = () =>
  useUploadMutation({
    mutationFn: VideosService.deleteVideo,
    invalidateKeys: (id) => [QUERY_KEYS.VIDEOS, QUERY_KEYS.VIDEO(id)],
    successMessage: "videos.videoDeleted",
  });

export const uploadVideoStandaloneOptions = () =>
  useUploadMutation({
    mutationFn: (video: string) => VideosService.upload(video),
    invalidateKeys: () => [],
  });
