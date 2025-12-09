import { z } from "zod";

export const searchVideosSchema = z.object({
  query: z.string().describe("Search query to find videos by title or description"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
});

export const searchDocumentsSchema = z.object({
  query: z.string().describe("Search query to find documents by title or description"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
});

export const searchQuizzesSchema = z.object({
  query: z.string().describe("Search query to find quizzes by title or description"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
});

export const searchModulesSchema = z.object({
  query: z.string().describe("Search query to find modules by title or description"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
});

export const createQuizSchema = z.object({
  title: z.string().describe("Quiz title"),
  description: z.string().optional().describe("Quiz description"),
  questions: z.array(z.object({
    type: z.enum(["multiple_choice", "true_false"]).describe("Question type"),
    questionText: z.string().describe("The question text"),
    explanation: z.string().optional().describe("Explanation shown after answering"),
    options: z.array(z.object({
      optionText: z.string().describe("Option text"),
      isCorrect: z.boolean().describe("Whether this is the correct answer"),
    })).describe("Answer options"),
  })).describe("List of questions"),
});

export const createModuleSchema = z.object({
  title: z.string().describe("Module title"),
  description: z.string().optional().describe("Module description"),
  items: z.array(z.object({
    type: z.enum(["video", "document", "quiz"]).describe("Content type"),
    id: z.string().describe("ID of existing or newly created content"),
    order: z.number().describe("Order within the module"),
    isPreview: z.boolean().optional().default(false).describe("Whether this item is free preview"),
  })).describe("Content items in the module"),
});

export const generateCoursePreviewSchema = z.object({
  title: z.string().describe("Course title"),
  shortDescription: z.string().describe("Brief course description (1-2 sentences)"),
  description: z.string().describe("Full course description"),
  level: z.enum(["beginner", "intermediate", "advanced"]).describe("Course difficulty level"),
  objectives: z.array(z.string()).describe("Learning objectives"),
  requirements: z.array(z.string()).describe("Course requirements/prerequisites"),
  features: z.array(z.string()).describe("What's included in the course"),
  categoryId: z.string().optional().describe("Category ID from listCategories"),
  categoryName: z.string().optional().describe("Category name for display"),
  modules: z.array(z.object({
    id: z.string().optional().describe("Module ID if existing"),
    title: z.string().describe("Module title"),
    description: z.string().optional().describe("Module description"),
    items: z.array(z.object({
      type: z.enum(["video", "document", "quiz"]).describe("Content type"),
      id: z.string().describe("Content ID"),
      title: z.string().describe("Content title"),
    })).describe("Items in this module"),
  })).describe("Course modules with their content"),
});

export const createCourseSchema = z.object({
  title: z.string().describe("Course title"),
  shortDescription: z.string().describe("Brief course description (1-2 sentences)"),
  description: z.string().describe("Full course description"),
  level: z.enum(["beginner", "intermediate", "advanced"]).describe("Course difficulty level"),
  objectives: z.array(z.string()).describe("Learning objectives"),
  requirements: z.array(z.string()).describe("Course requirements/prerequisites"),
  features: z.array(z.string()).describe("Course features/highlights"),
  moduleIds: z.array(z.string()).describe("IDs of modules to include (from createModule results)"),
  categoryId: z.string().optional().describe("Category ID for the course if known"),
});

export type SearchVideosParams = z.infer<typeof searchVideosSchema>;
export type SearchDocumentsParams = z.infer<typeof searchDocumentsSchema>;
export type SearchQuizzesParams = z.infer<typeof searchQuizzesSchema>;
export type SearchModulesParams = z.infer<typeof searchModulesSchema>;
export type CreateQuizParams = z.infer<typeof createQuizSchema>;
export type CreateModuleParams = z.infer<typeof createModuleSchema>;
export type GenerateCoursePreviewParams = z.infer<typeof generateCoursePreviewSchema>;
export type CreateCourseParams = z.infer<typeof createCourseSchema>;

export type CoursePreview = {
  title: string;
  shortDescription: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  objectives: string[];
  requirements: string[];
  features: string[];
  categoryId?: string;
  categoryName?: string;
  modules: Array<{
    id?: string;
    title: string;
    description?: string;
    items: Array<{
      type: "video" | "document" | "quiz";
      id: string;
      title: string;
    }>;
  }>;
};
