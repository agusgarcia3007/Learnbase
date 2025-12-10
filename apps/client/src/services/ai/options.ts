import { mutationOptions } from "@tanstack/react-query";
import {
  AIService,
  type GenerateQuestionsRequest,
  type GenerateCourseRequest,
  type GenerateThemeRequest,
  type GenerateThumbnailRequest,
} from "./service";

export const analyzeVideoOptions = () =>
  mutationOptions({
    mutationFn: (videoKey: string) => AIService.analyzeVideo(videoKey),
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
