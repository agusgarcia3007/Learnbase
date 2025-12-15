import { z } from "zod";

export const searchContentSchema = z.object({
  query: z.string().describe("Search query to find content by title or description"),
  limit: z.number().optional().default(5).describe("Maximum results per content type (videos, documents, quizzes, modules)"),
});

export const listCategoriesSchema = z.object({
  limit: z.number().optional().default(20).describe("Maximum number of categories to return"),
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
    id: z.string().describe("ACTUAL UUID from searchVideos/searchDocuments/searchQuizzes results. NEVER use placeholder strings like 'video-id-1'."),
    order: z.number().describe("Order within the module"),
    isPreview: z.boolean().optional().default(false).describe("Whether this item is free preview"),
  })).describe("Content items in the module - use REAL IDs from search results"),
});

export const generateCoursePreviewSchema = z.object({
  title: z.string().describe("Course title"),
  shortDescription: z.string().describe("Brief course description (1-2 sentences)"),
  description: z.string().describe("Full course description"),
  level: z.enum(["beginner", "intermediate", "advanced"]).describe("Course difficulty level"),
  objectives: z.array(z.string()).describe("Learning objectives"),
  requirements: z.array(z.string()).describe("Course requirements/prerequisites"),
  features: z.array(z.string()).describe("What's included in the course"),
  moduleIds: z.array(z.string()).describe("Module IDs from createModule results - use the 'id' field returned by createModule"),
  categoryIds: z.array(z.string()).optional().describe("Category IDs from listCategories"),
  price: z.number().optional().describe("Course price in USD cents (0 = free). Example: $50 = 5000"),
  customThumbnailKey: z.string().optional().describe("S3 key for custom thumbnail if user provided one"),
  thumbnailStyle: z.string().optional().describe("Style description for AI thumbnail generation if user specified"),
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
  categoryIds: z.array(z.string()).optional().describe("Category IDs for the course from listCategories"),
  price: z.number().optional().describe("Course price in USD cents (0 = free). Example: $50 = 5000"),
  currency: z.string().optional().describe("Currency code (USD, EUR, etc). Defaults to USD"),
  customThumbnailKey: z.string().optional().describe("S3 key for custom thumbnail if user provided one"),
  previewVideoUrl: z.string().url().optional().describe("URL for course preview video"),
});

export type SearchContentParams = z.infer<typeof searchContentSchema>;
export type ListCategoriesParams = z.infer<typeof listCategoriesSchema>;
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
  categoryIds?: string[];
  categoryNames?: string[];
  price?: number;
  customThumbnailKey?: string;
  thumbnailStyle?: string;
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

export const getCourseSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to retrieve"),
});

export const updateCourseSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to update"),
  title: z.string().min(1).optional().describe("New course title"),
  shortDescription: z.string().optional().describe("Brief course description (1-2 sentences)"),
  description: z.string().optional().describe("Full course description"),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Course difficulty level"),
  price: z.number().min(0).optional().describe("Course price in USD cents (0 = free). Example: $50 = 5000"),
  originalPrice: z.number().min(0).nullable().optional().describe("Original price for showing discount"),
  currency: z.string().optional().describe("Currency code (USD, EUR, etc)"),
  tags: z.array(z.string()).optional().describe("Course tags for categorization"),
  features: z.array(z.string()).optional().describe("What's included in the course"),
  requirements: z.array(z.string()).optional().describe("Course requirements/prerequisites"),
  objectives: z.array(z.string()).optional().describe("Learning objectives"),
  categoryIds: z.array(z.string().uuid()).optional().describe("Category IDs from listCategories (empty array to remove all)"),
  instructorId: z.string().uuid().nullable().optional().describe("Instructor ID from listInstructors (null to remove)"),
  language: z.string().optional().describe("Language code (e.g., 'es', 'en', 'pt')"),
  includeCertificate: z.boolean().optional().describe("Whether to include certificate on completion"),
  thumbnail: z.string().nullable().optional().describe("S3 key for course thumbnail image (from uploaded image, null to remove)"),
  previewVideoUrl: z.string().url().nullable().optional().describe("URL for course preview video (null to remove)"),
});

export const updateCourseModulesSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to update"),
  mode: z.enum(["add", "remove", "replace"])
    .default("add")
    .describe("add: keeps existing modules and adds new ones (DEFAULT), remove: removes specified modules, replace: replaces ALL modules"),
  modules: z.array(z.object({
    moduleId: z.string().uuid().describe("Module ID from searchContent or createModule results"),
    order: z.number().min(0).optional().describe("Order position (auto-calculated for 'add' mode if omitted)"),
  })).describe("Modules to add, remove, or replace with"),
});

export const updateModuleItemsSchema = z.object({
  moduleId: z.string().uuid().describe("The UUID of the module to update"),
  mode: z.enum(["add", "remove", "replace"])
    .default("add")
    .describe("add: keeps existing items and adds new ones (DEFAULT), remove: removes specified items, replace: replaces ALL items"),
  items: z.array(z.object({
    contentType: z.enum(["video", "document", "quiz"]).describe("Type of content"),
    contentId: z.string().uuid().describe("UUID of the content item from searchContent results"),
    order: z.number().min(0).optional().describe("Order position (auto-calculated for 'add' mode if omitted)"),
    isPreview: z.boolean().optional().default(false).describe("Whether this item is free preview"),
  })).describe("Items to add, remove, or replace with"),
});

export const publishCourseSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to publish"),
  confirmed: z.boolean().describe("Must be true to publish. If false, returns confirmation request."),
});

export const unpublishCourseSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to unpublish"),
  confirmed: z.boolean().describe("Must be true to unpublish. This is a destructive action - students will lose access."),
});

export const deleteCourseSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to delete"),
  confirmed: z.boolean().describe("Must be true to delete. This is PERMANENT and cannot be undone."),
});

export const thumbnailStyleEnum = z.enum([
  "abstract",
  "realistic",
  "minimal",
  "professional",
]);

export const regenerateThumbnailSchema = z.object({
  courseId: z.string().uuid().describe("The UUID of the course to regenerate thumbnail for"),
  style: thumbnailStyleEnum.optional().default("abstract").describe("Visual style: abstract (3D shapes, no people), realistic (photos with real people), minimal (clean design), professional (corporate). Use 'realistic' for images with doctors, teachers, etc."),
});

export const listInstructorsSchema = z.object({
  limit: z.number().optional().default(20).describe("Maximum number of instructors to return"),
});

// CATEGORIES MANAGEMENT
export const createCategorySchema = z.object({
  name: z.string().min(1).describe("Category name"),
  description: z.string().optional().describe("Category description"),
});

export const updateCategorySchema = z.object({
  categoryId: z.string().uuid().describe("Category ID to update"),
  name: z.string().min(1).optional().describe("New category name"),
  description: z.string().nullable().optional().describe("New description"),
});

export const deleteCategorySchema = z.object({
  categoryId: z.string().uuid().describe("Category ID to delete"),
  confirmed: z.boolean().describe("Must be true to delete"),
});

// INSTRUCTORS MANAGEMENT
export const createInstructorSchema = z.object({
  name: z.string().min(1).describe("Instructor name"),
  title: z.string().optional().describe("Professional title"),
  bio: z.string().optional().describe("Biography"),
});

export const updateInstructorSchema = z.object({
  instructorId: z.string().uuid().describe("Instructor ID to update"),
  name: z.string().min(1).optional().describe("New name"),
  title: z.string().nullable().optional().describe("New title"),
  bio: z.string().nullable().optional().describe("New bio"),
});

export const deleteInstructorSchema = z.object({
  instructorId: z.string().uuid().describe("Instructor ID to delete"),
  confirmed: z.boolean().describe("Must be true to delete"),
});

// LIST CONTENT
export const listVideosSchema = z.object({
  limit: z.number().optional().default(20).describe("Max videos to return"),
  search: z.string().optional().describe("Search by title"),
  status: z.enum(["draft", "published"]).optional().describe("Filter by status"),
});

export const listDocumentsSchema = z.object({
  limit: z.number().optional().default(20).describe("Max documents to return"),
  search: z.string().optional().describe("Search by title"),
  status: z.enum(["draft", "published"]).optional().describe("Filter by status"),
});

export const listQuizzesSchema = z.object({
  limit: z.number().optional().default(20).describe("Max quizzes to return"),
  search: z.string().optional().describe("Search by title"),
  status: z.enum(["draft", "published"]).optional().describe("Filter by status"),
});

export const listModulesSchema = z.object({
  limit: z.number().optional().default(20).describe("Max modules to return"),
  search: z.string().optional().describe("Search by title"),
  status: z.enum(["draft", "published"]).optional().describe("Filter by status"),
});

// QUIZ MANAGEMENT
export const getQuizSchema = z.object({
  quizId: z.string().uuid().describe("Quiz ID to get"),
});

export const updateQuizMetadataSchema = z.object({
  quizId: z.string().uuid().describe("Quiz ID to update"),
  title: z.string().min(1).optional().describe("New title"),
  description: z.string().nullable().optional().describe("New description"),
  status: z.enum(["draft", "published"]).optional().describe("New status"),
});

export const deleteQuizSchema = z.object({
  quizId: z.string().uuid().describe("Quiz ID to delete"),
  confirmed: z.boolean().describe("Must be true to delete"),
});

// QUIZ QUESTIONS
export const addQuizQuestionSchema = z.object({
  quizId: z.string().uuid().describe("Quiz ID to add question to"),
  type: z.enum(["multiple_choice", "true_false"]).describe("Question type"),
  questionText: z.string().min(1).describe("Question text"),
  explanation: z.string().optional().describe("Explanation after answering"),
  options: z.array(z.object({
    optionText: z.string().describe("Option text"),
    isCorrect: z.boolean().describe("Is this the correct answer"),
  })).min(2).describe("Answer options"),
});

export const updateQuizQuestionSchema = z.object({
  questionId: z.string().uuid().describe("Question ID to update"),
  questionText: z.string().min(1).optional().describe("New question text"),
  explanation: z.string().nullable().optional().describe("New explanation"),
});

export const deleteQuizQuestionSchema = z.object({
  questionId: z.string().uuid().describe("Question ID to delete"),
});

export const reorderQuizQuestionsSchema = z.object({
  quizId: z.string().uuid().describe("Quiz ID"),
  questionIds: z.array(z.string().uuid()).describe("Question IDs in new order"),
});

// QUIZ OPTIONS
export const addQuizOptionSchema = z.object({
  questionId: z.string().uuid().describe("Question ID to add option to"),
  optionText: z.string().min(1).describe("Option text"),
  isCorrect: z.boolean().describe("Is this the correct answer"),
});

export const updateQuizOptionSchema = z.object({
  optionId: z.string().uuid().describe("Option ID to update"),
  optionText: z.string().min(1).optional().describe("New option text"),
  isCorrect: z.boolean().optional().describe("New correct status"),
});

export const deleteQuizOptionSchema = z.object({
  optionId: z.string().uuid().describe("Option ID to delete"),
});

// MODULES
export const getModuleSchema = z.object({
  moduleId: z.string().uuid().describe("Module ID to get"),
});

export const updateModuleMetadataSchema = z.object({
  moduleId: z.string().uuid().describe("Module ID to update"),
  title: z.string().min(1).optional().describe("New title"),
  description: z.string().nullable().optional().describe("New description"),
  status: z.enum(["draft", "published"]).optional().describe("New status"),
});

export const deleteModuleSchema = z.object({
  moduleId: z.string().uuid().describe("Module ID to delete"),
  confirmed: z.boolean().describe("Must be true to delete"),
});

export const generateQuizFromContentSchema = z.object({
  sourceType: z.enum(["video", "document"]).describe("Type of content to generate quiz from"),
  sourceId: z.string().uuid().describe("UUID of the video or document"),
  title: z.string().optional().describe("Optional title for the quiz. If not provided, will be generated based on content"),
  questionCount: z.number().min(1).max(10).default(3).describe("Number of questions to generate (default: 3)"),
  moduleId: z.string().uuid().optional().describe("Optional module ID to add the quiz to after creation"),
});

export type GetCourseParams = z.infer<typeof getCourseSchema>;
export type UpdateCourseParams = z.infer<typeof updateCourseSchema>;
export type UpdateCourseModulesParams = z.infer<typeof updateCourseModulesSchema>;
export type UpdateModuleItemsParams = z.infer<typeof updateModuleItemsSchema>;
export type PublishCourseParams = z.infer<typeof publishCourseSchema>;
export type UnpublishCourseParams = z.infer<typeof unpublishCourseSchema>;
export type DeleteCourseParams = z.infer<typeof deleteCourseSchema>;
export type RegenerateThumbnailParams = z.infer<typeof regenerateThumbnailSchema>;
export type ListInstructorsParams = z.infer<typeof listInstructorsSchema>;

export type CreateCategoryParams = z.infer<typeof createCategorySchema>;
export type UpdateCategoryParams = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryParams = z.infer<typeof deleteCategorySchema>;
export type CreateInstructorParams = z.infer<typeof createInstructorSchema>;
export type UpdateInstructorParams = z.infer<typeof updateInstructorSchema>;
export type DeleteInstructorParams = z.infer<typeof deleteInstructorSchema>;
export type ListVideosParams = z.infer<typeof listVideosSchema>;
export type ListDocumentsParams = z.infer<typeof listDocumentsSchema>;
export type ListQuizzesParams = z.infer<typeof listQuizzesSchema>;
export type ListModulesParams = z.infer<typeof listModulesSchema>;
export type GetQuizParams = z.infer<typeof getQuizSchema>;
export type UpdateQuizMetadataParams = z.infer<typeof updateQuizMetadataSchema>;
export type DeleteQuizParams = z.infer<typeof deleteQuizSchema>;
export type AddQuizQuestionParams = z.infer<typeof addQuizQuestionSchema>;
export type UpdateQuizQuestionParams = z.infer<typeof updateQuizQuestionSchema>;
export type DeleteQuizQuestionParams = z.infer<typeof deleteQuizQuestionSchema>;
export type ReorderQuizQuestionsParams = z.infer<typeof reorderQuizQuestionsSchema>;
export type AddQuizOptionParams = z.infer<typeof addQuizOptionSchema>;
export type UpdateQuizOptionParams = z.infer<typeof updateQuizOptionSchema>;
export type DeleteQuizOptionParams = z.infer<typeof deleteQuizOptionSchema>;
export type GetModuleParams = z.infer<typeof getModuleSchema>;
export type UpdateModuleMetadataParams = z.infer<typeof updateModuleMetadataSchema>;
export type DeleteModuleParams = z.infer<typeof deleteModuleSchema>;
export type GenerateQuizFromContentParams = z.infer<typeof generateQuizFromContentSchema>;
