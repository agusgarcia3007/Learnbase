import { Elysia } from "elysia";
import { contentAnalysisRoutes } from "./content-analysis";
import { courseGenerationRoutes } from "./course-generation";
import { themeGenerationRoutes } from "./theme-generation";
import { chatCreatorRoutes } from "./chat-creator";
import { chatLearnRoutes } from "./chat-learn";

export const aiRoutes = new Elysia()
  .use(contentAnalysisRoutes)
  .use(courseGenerationRoutes)
  .use(themeGenerationRoutes)
  .use(chatCreatorRoutes)
  .use(chatLearnRoutes);
