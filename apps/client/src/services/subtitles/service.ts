import { http } from "@/lib/http";
import type { Subtitle } from "@/services/videos/service";

export const QUERY_KEYS = {
  VIDEO_SUBTITLES: (videoId: string) => ["subtitles", "video", videoId],
} as const;

export const SubtitlesService = {
  async getByVideo(videoId: string) {
    const { data } = await http.get<{ subtitles: Subtitle[] }>(
      `/ai/videos/${videoId}/subtitles`
    );
    return data;
  },

  async generate(videoId: string, sourceLanguage?: string) {
    const { data } = await http.post<{ subtitleId: string; status: string }>(
      `/ai/videos/${videoId}/subtitles/generate`,
      sourceLanguage ? { sourceLanguage } : undefined
    );
    return data;
  },

  async translate(videoId: string, targetLanguage: string) {
    const { data } = await http.post<{ subtitleId: string; status: string }>(
      `/ai/videos/${videoId}/subtitles/translate`,
      { targetLanguage }
    );
    return data;
  },

  async delete(subtitleId: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/ai/subtitles/${subtitleId}`
    );
    return data;
  },
} as const;
