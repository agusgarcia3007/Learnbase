import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { VideoListParams } from "./service";
import { videosListOptions, videosInfiniteOptions, videoOptions } from "./options";

export const useVideosList = (params?: VideoListParams) =>
  useQuery(videosListOptions(params));

export const useVideosInfinite = (params?: Omit<VideoListParams, "page">) =>
  useInfiniteQuery(videosInfiniteOptions(params));

type UseVideoOptions = {
  refetchInterval?: number | false;
};

export const useVideo = (id: string, options?: UseVideoOptions) =>
  useQuery({
    ...videoOptions(id),
    refetchInterval: options?.refetchInterval,
  });
