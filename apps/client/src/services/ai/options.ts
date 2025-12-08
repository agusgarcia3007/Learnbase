import { mutationOptions } from "@tanstack/react-query";
import { AIService, type GenerateQuestionsRequest } from "./service";

export const analyzeVideoOptions = () =>
  mutationOptions({
    mutationFn: (videoId: string) => AIService.analyzeVideo(videoId),
  });

export const generateQuizQuestionsOptions = () =>
  mutationOptions({
    mutationFn: ({
      quizId,
      ...payload
    }: { quizId: string } & GenerateQuestionsRequest) =>
      AIService.generateQuizQuestions(quizId, payload),
  });
