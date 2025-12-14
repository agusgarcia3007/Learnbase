import { useMutation } from "@tanstack/react-query";
import {
  analyzeVideoOptions,
  generateQuizQuestionsOptions,
  generateCourseOptions,
  generateThemeOptions,
  generateThumbnailOptions,
  generateModuleOptions,
} from "./options";

export const useAnalyzeVideo = () => useMutation(analyzeVideoOptions());

export const useGenerateQuizQuestions = () =>
  useMutation(generateQuizQuestionsOptions());

export const useGenerateCourse = () => useMutation(generateCourseOptions());

export const useGenerateTheme = () => useMutation(generateThemeOptions());

export const useGenerateThumbnail = () =>
  useMutation(generateThumbnailOptions());

export const useGenerateModule = () => useMutation(generateModuleOptions());
