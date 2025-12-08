import { http } from "@/lib/http";

export type GenerateContentResponse = {
  content: string;
};

export const QUERY_KEYS = {
  AI: ["ai"],
} as const;

export const AIService = {
  async generateVideoTitle(videoId: string) {
    const { data } = await http.post<GenerateContentResponse>(
      `/ai/videos/${videoId}/generate-title`
    );
    return data;
  },

  async generateVideoDescription(videoId: string) {
    const { data } = await http.post<GenerateContentResponse>(
      `/ai/videos/${videoId}/generate-description`
    );
    return data;
  },
} as const;
