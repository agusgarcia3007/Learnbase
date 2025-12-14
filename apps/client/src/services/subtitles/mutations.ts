import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubtitlesService, QUERY_KEYS, type SubtitleLanguage } from "./service";

export function useGenerateSubtitles(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SubtitlesService.generate(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBTITLES(videoId) });
    },
  });
}

export function useTranslateSubtitles(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetLanguage: SubtitleLanguage) =>
      SubtitlesService.translate(videoId, targetLanguage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBTITLES(videoId) });
    },
  });
}
