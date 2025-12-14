import { useQuery } from "@tanstack/react-query";
import { SubtitlesService, QUERY_KEYS } from "./service";

export function useVideoSubtitles(videoId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SUBTITLES(videoId),
    queryFn: () => SubtitlesService.list(videoId),
    enabled: !!videoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.subtitles.some(
        (s) => s.status === "processing" || s.status === "pending"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}
