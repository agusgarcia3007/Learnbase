import { mutationOptions } from "@tanstack/react-query";
import {
  AIService,
  type GenerateQuestionsRequest,
  type GenerateCourseRequest,
  type GenerateThemeRequest,
  type GenerateThumbnailRequest,
  type GenerateModuleRequest,
  type SubmitFeedbackRequest,
} from "./service";

export const analyzeVideoOptions = () =>
  mutationOptions({
    mutationFn: ({ videoKey, videoId }: { videoKey: string; videoId?: string }) =>
      AIService.analyzeVideo(videoKey, videoId),
  });

export const generateQuizQuestionsOptions = () =>
  mutationOptions({
    mutationFn: ({
      quizId,
      ...payload
    }: { quizId: string } & GenerateQuestionsRequest) =>
      AIService.generateQuizQuestions(quizId, payload),
  });

export const generateCourseOptions = () =>
  mutationOptions({
    mutationFn: (payload: GenerateCourseRequest) =>
      AIService.generateCourse(payload),
  });

export const generateThemeOptions = () =>
  mutationOptions({
    mutationFn: (payload: GenerateThemeRequest) =>
      AIService.generateTheme(payload),
  });

export const generateThumbnailOptions = () =>
  mutationOptions({
    mutationFn: (payload: GenerateThumbnailRequest) =>
      AIService.generateThumbnail(payload),
  });

export const generateModuleOptions = () =>
  mutationOptions({
    mutationFn: (payload: GenerateModuleRequest) =>
      AIService.generateModule(payload),
  });

export const submitFeedbackOptions = () =>
  mutationOptions({
    mutationFn: (payload: SubmitFeedbackRequest) =>
      AIService.submitFeedback(payload),
  });
