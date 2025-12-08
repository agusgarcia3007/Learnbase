import { mutationOptions } from "@tanstack/react-query";
import { AIService } from "./service";
import { catchAxiosError } from "@/lib/utils";

export const generateVideoTitleOptions = () =>
  mutationOptions({
    mutationFn: (videoId: string) => AIService.generateVideoTitle(videoId),
    onError: catchAxiosError,
  });

export const generateVideoDescriptionOptions = () =>
  mutationOptions({
    mutationFn: (videoId: string) => AIService.generateVideoDescription(videoId),
    onError: catchAxiosError,
  });
