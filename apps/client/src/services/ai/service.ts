import { http } from "@/lib/http";

export type AnalyzeVideoResponse = {
  title: string;
  description: string;
};

export type GeneratedQuestionOption = {
  optionText: string;
  isCorrect: boolean;
};

export type GeneratedQuestion = {
  type: "multiple_choice" | "multiple_select";
  questionText: string;
  explanation: string;
  options: GeneratedQuestionOption[];
};

export type GenerateQuestionsRequest = {
  sourceType: "video" | "document";
  sourceId: string;
  count: number;
};

export type GenerateQuestionsResponse = {
  questions: GeneratedQuestion[];
};

export type GenerateCourseRequest = {
  moduleIds: string[];
};

export type GenerateCourseResponse = {
  title: string;
  shortDescription: string;
  description: string;
  objectives: string[];
  requirements: string[];
  features: string[];
  thumbnail: string | null;
};

export const QUERY_KEYS = {
  AI: ["ai"],
} as const;

export const AIService = {
  async analyzeVideo(videoId: string) {
    const { data } = await http.post<AnalyzeVideoResponse>(
      `/ai/videos/${videoId}/analyze`
    );
    return data;
  },

  async generateQuizQuestions(quizId: string, payload: GenerateQuestionsRequest) {
    const { data } = await http.post<GenerateQuestionsResponse>(
      `/ai/quizzes/${quizId}/generate`,
      payload
    );
    return data;
  },

  async generateCourse(payload: GenerateCourseRequest) {
    const { data } = await http.post<GenerateCourseResponse>(
      "/ai/courses/generate",
      payload
    );
    return data;
  },
} as const;
