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

export type GenerateCourseThumbnailResponse = {
  success: boolean;
  thumbnailUrl?: string;
  error?: string;
};

export type GenerateThumbnailRequest = {
  title: string;
  description?: string;
};

export type GenerateThumbnailResponse = {
  thumbnail: string;
};

export type GenerateThemeRequest = {
  primaryColor?: string;
  style?: string;
};

export type GeneratedTheme = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  shadow: string;
  shadowLg: string;
  radius: string;
  backgroundDark: string;
  foregroundDark: string;
  cardDark: string;
  cardForegroundDark: string;
  popoverDark: string;
  popoverForegroundDark: string;
  primaryDark: string;
  primaryForegroundDark: string;
  secondaryDark: string;
  secondaryForegroundDark: string;
  mutedDark: string;
  mutedForegroundDark: string;
  accentDark: string;
  accentForegroundDark: string;
  destructiveDark: string;
  destructiveForegroundDark: string;
  borderDark: string;
  inputDark: string;
  ringDark: string;
  chart1Dark: string;
  chart2Dark: string;
  chart3Dark: string;
  chart4Dark: string;
  chart5Dark: string;
  sidebarDark: string;
  sidebarForegroundDark: string;
  sidebarPrimaryDark: string;
  sidebarPrimaryForegroundDark: string;
  sidebarAccentDark: string;
  sidebarAccentForegroundDark: string;
  sidebarBorderDark: string;
  sidebarRingDark: string;
  shadowDark: string;
  shadowLgDark: string;
  fontHeading: string;
  fontBody: string;
};

export type GenerateThemeResponse = {
  theme: GeneratedTheme;
};

export const QUERY_KEYS = {
  AI: ["ai"],
} as const;

export const AIService = {
  async analyzeVideo(videoKey: string, videoId?: string) {
    const { data } = await http.post<AnalyzeVideoResponse>("/ai/videos/analyze", {
      videoKey,
      videoId,
    });
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

  async generateCourseThumbnail(courseId: string) {
    const { data } = await http.post<GenerateCourseThumbnailResponse>(
      `/ai/courses/${courseId}/thumbnail`
    );
    return data;
  },

  async generateTheme(payload: GenerateThemeRequest) {
    const { data } = await http.post<GenerateThemeResponse>(
      "/ai/themes/generate",
      payload
    );
    return data;
  },

  async generateThumbnail(payload: GenerateThumbnailRequest) {
    const { data } = await http.post<GenerateThumbnailResponse>(
      "/ai/thumbnail/generate",
      payload
    );
    return data;
  },
} as const;
