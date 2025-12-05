import { useQuery } from "@tanstack/react-query";
import type { VideoListParams } from "./service";
import { videosListOptions, videoOptions } from "./options";

export const useVideosList = (params?: VideoListParams) =>
  useQuery(videosListOptions(params));

export const useVideo = (id: string) => useQuery(videoOptions(id));
