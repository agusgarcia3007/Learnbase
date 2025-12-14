import { http } from "@/lib/http";

export type SubtitleLanguage = "en" | "es" | "pt";
export type SubtitleStatus = "pending" | "processing" | "completed" | "failed";

export type Subtitle = {
  id: string;
  language: SubtitleLanguage;
  label: string;
  isOriginal: boolean;
  status: SubtitleStatus;
  vttUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export const LANGUAGE_LABELS: Record<SubtitleLanguage, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export const QUERY_KEYS = {
  SUBTITLES: (videoId: string) => ["subtitles", videoId],
} as const;

export const SubtitlesService = {
  async list(videoId: string) {
    const { data } = await http.get<{ subtitles: Subtitle[] }>(
      `/ai/videos/${videoId}/subtitles`
    );
    return data;
  },

  async generate(videoId: string) {
    const { data } = await http.post<{ subtitleId: string; status: string }>(
      `/ai/videos/${videoId}/subtitles/generate`
    );
    return data;
  },

  async translate(videoId: string, targetLanguage: SubtitleLanguage) {
    const { data } = await http.post<{ subtitleId: string; status: string }>(
      `/ai/videos/${videoId}/subtitles/translate`,
      { targetLanguage }
    );
    return data;
  },

  async getVtt(subtitleId: string) {
    const { data } = await http.get<{ vttUrl?: string; vtt?: string }>(
      `/ai/subtitles/${subtitleId}/vtt`
    );
    return data;
  },
} as const;
