import { http } from "@/lib/http";

export type ItemProgressStatus = "not_started" | "in_progress" | "completed";
export type ContentType = "video" | "document" | "quiz";

export type LearnModuleItem = {
  id: string;
  title: string;
  contentType: ContentType;
  order: number;
  duration?: number;
  status: ItemProgressStatus;
  videoProgress?: number;
};

export type LearnModule = {
  id: string;
  title: string;
  order: number;
  items: LearnModuleItem[];
};

export type LearnCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
};

export type LearnEnrollment = {
  id: string;
  progress: number;
  status: string;
};

export type CourseStructure = {
  course: LearnCourse;
  enrollment: LearnEnrollment;
  modules: LearnModule[];
  resumeItemId: string | null;
};

export type VideoContent = {
  type: "video";
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  duration: number;
  videoProgress: number;
};

export type DocumentContent = {
  type: "document";
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  mimeType: string | null;
  fileName: string | null;
};

export type QuizOption = {
  id: string;
  optionText: string;
  order: number;
};

export type QuizQuestion = {
  id: string;
  type: "multiple_choice" | "multiple_select" | "true_false";
  questionText: string;
  explanation: string | null;
  order: number;
  options: QuizOption[];
};

export type QuizContent = {
  type: "quiz";
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
};

export type ItemContent = VideoContent | DocumentContent | QuizContent;

export type UpdateProgressPayload = {
  videoProgress?: number;
  status?: "in_progress";
};

export type CompleteItemResponse = {
  success: boolean;
  progress: number;
  courseCompleted: boolean;
};

export const QUERY_KEYS = {
  LEARN: ["learn"] as const,
  COURSE_STRUCTURE: (courseSlug: string) => ["learn", "structure", courseSlug] as const,
  ITEM_CONTENT: (itemId: string) => ["learn", "content", itemId] as const,
} as const;

export const LearnService = {
  async getCourseStructure(courseSlug: string) {
    const { data } = await http.get<CourseStructure>(
      `/learn/courses/${courseSlug}/structure`
    );
    return data;
  },

  async getItemContent(moduleItemId: string) {
    const { data } = await http.get<ItemContent>(
      `/learn/items/${moduleItemId}/content`
    );
    return data;
  },

  async updateProgress(moduleItemId: string, payload: UpdateProgressPayload) {
    const { data } = await http.patch<{ success: boolean }>(
      `/learn/items/${moduleItemId}/progress`,
      payload
    );
    return data;
  },

  async completeItem(moduleItemId: string) {
    const { data } = await http.post<CompleteItemResponse>(
      `/learn/items/${moduleItemId}/complete`
    );
    return data;
  },
} as const;
