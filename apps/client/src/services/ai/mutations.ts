import { useMutation } from "@tanstack/react-query";
import { analyzeVideoOptions, generateQuizQuestionsOptions } from "./options";

export const useAnalyzeVideo = () => useMutation(analyzeVideoOptions());

export const useGenerateQuizQuestions = () =>
  useMutation(generateQuizQuestionsOptions());
