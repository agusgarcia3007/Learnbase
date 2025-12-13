import { createEmbeddingCache, type ToolContext, type ValidatedContextCourse } from "./utils";
import { createCategoryTools } from "./category-tools";
import { createInstructorTools } from "./instructor-tools";
import { createContentListTools } from "./content-list-tools";
import { createQuizTools } from "./quiz-tools";
import { createModuleTools } from "./module-tools";
import { createCourseTools } from "./course-tools";

export * from "./schemas";
export * from "./utils";

export function createCourseCreatorTools(
  tenantId: string,
  cache?: Map<string, unknown>,
  contextCourses?: ValidatedContextCourse[]
) {
  const searchCache = cache ?? new Map<string, unknown>();
  const getCachedEmbedding = createEmbeddingCache();

  const ctx: ToolContext = {
    tenantId,
    searchCache,
    getCachedEmbedding,
    contextCourses,
  };

  return {
    ...createContentListTools(ctx),
    ...createCategoryTools(ctx),
    ...createInstructorTools(ctx),
    ...createQuizTools(ctx),
    ...createModuleTools(ctx),
    ...createCourseTools(ctx),
  };
}

export type CourseCreatorTools = ReturnType<typeof createCourseCreatorTools>;
