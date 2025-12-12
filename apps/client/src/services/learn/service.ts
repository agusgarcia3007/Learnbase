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

export type LearnModuleLite = {
  id: string;
  title: string;
  order: number;
  itemsCount: number;
};

export type ModuleProgressData = {
  moduleId: string;
  completed: number;
  total: number;
};

export type ItemIdWithModule = {
  id: string;
  moduleId: string;
};

export type CourseProgress = {
  totalItems: number;
  completedItems: number;
  moduleProgress: ModuleProgressData[];
  itemIds: ItemIdWithModule[];
};

export type ModuleItemsResponse = {
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
  modules: LearnModuleLite[];
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

export type ToggleCompleteResponse = {
  success: boolean;
  newStatus: ItemProgressStatus;
  progress: number;
  courseCompleted: boolean;
};

export type RelatedCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  shortDescription: string | null;
  price: number;
  currency: string;
  instructor: {
    name: string;
    avatar: string | null;
  } | null;
};

export type RelatedCoursesResponse = {
  courses: RelatedCourse[];
};

export const QUERY_KEYS = {
  LEARN: ["learn"] as const,
  COURSE_STRUCTURE: (courseSlug: string) => ["learn", "structure", courseSlug] as const,
  COURSE_PROGRESS: (courseSlug: string) => ["learn", "progress", courseSlug] as const,
  MODULE_ITEMS: (moduleId: string) => ["learn", "module", moduleId, "items"] as const,
  ITEM_CONTENT: (itemId: string) => ["learn", "content", itemId] as const,
  RELATED_COURSES: (courseSlug: string) => ["learn", "related", courseSlug] as const,
} as const;

export const LearnService = {
  async getCourseStructure(courseSlug: string) {
    const { data } = await http.get<CourseStructure>(
      `/learn/courses/${courseSlug}/structure`
    );
    return data;
  },

  async getCourseProgress(courseSlug: string) {
    const { data } = await http.get<CourseProgress>(
      `/learn/courses/${courseSlug}/progress`
    );
    return data;
  },

  async getModuleItems(moduleId: string) {
    const { data } = await http.get<ModuleItemsResponse>(
      `/learn/modules/${moduleId}/items`
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

  async toggleItemComplete(moduleItemId: string) {
    const { data } = await http.post<ToggleCompleteResponse>(
      `/learn/items/${moduleItemId}/toggle-complete`
    );
    return data;
  },

  async getRelatedCourses(courseSlug: string) {
    const { data } = await http.get<RelatedCoursesResponse>(
      `/learn/courses/${courseSlug}/related`
    );
    return data;
  },
} as const;
