import { useQuery } from "@tanstack/react-query";
import type { QuizListParams } from "./service";
import { quizzesListOptions, quizOptions, quizQuestionsOptions } from "./options";

export const useQuizzesList = (params?: QuizListParams) =>
  useQuery(quizzesListOptions(params));

export const useQuiz = (id: string) => useQuery(quizOptions(id));

export const useQuizQuestions = (quizId: string) =>
  useQuery(quizQuestionsOptions(quizId));
