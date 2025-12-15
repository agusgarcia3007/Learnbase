import { useQuery } from "@tanstack/react-query";
import { SubtitlesService, QUERY_KEYS } from "./service";

export function useVideoSubtitles(videoId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VIDEO_SUBTITLES(videoId),
    queryFn: () => SubtitlesService.getByVideo(videoId),
    enabled: !!videoId,
    refetchInterval: (query) => {
      const subtitles = query.state.data?.subtitles ?? [];
      const hasProcessing = subtitles.some(
        (s) => s.status === "processing" || s.status === "pending"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}
