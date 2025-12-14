import { Elysia } from "elysia";
import { contentAnalysisRoutes } from "./content-analysis";
import { courseGenerationRoutes } from "./course-generation";
import { moduleGenerationRoutes } from "./module-generation";
import { themeGenerationRoutes } from "./theme-generation";
import { chatCreatorRoutes } from "./chat-creator";
import { chatLearnRoutes } from "./chat-learn";
import { subtitlesRoutes } from "./subtitles";

export const aiRoutes = new Elysia()
  .use(contentAnalysisRoutes)
  .use(courseGenerationRoutes)
  .use(moduleGenerationRoutes)
  .use(themeGenerationRoutes)
  .use(chatCreatorRoutes)
  .use(chatLearnRoutes)
  .use(subtitlesRoutes);
