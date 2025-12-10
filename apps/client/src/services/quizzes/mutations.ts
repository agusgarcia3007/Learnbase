import { useMutation } from "@tanstack/react-query";
import {
  useCreateQuizOptions,
  useUpdateQuizOptions,
  useDeleteQuizOptions,
  useBulkDeleteQuizzesOptions,
  useCreateQuestionOptions,
  useUpdateQuestionOptions,
  useDeleteQuestionOptions,
  useReorderQuestionsOptions,
  useCreateOptionOptions,
  useUpdateOptionOptions,
  useDeleteOptionOptions,
} from "./options";

export const useCreateQuiz = () => useMutation(useCreateQuizOptions());

export const useUpdateQuiz = () => useMutation(useUpdateQuizOptions());

export const useDeleteQuiz = () => useMutation(useDeleteQuizOptions());

export const useBulkDeleteQuizzes = () => useMutation(useBulkDeleteQuizzesOptions());

export const useCreateQuestion = () => useMutation(useCreateQuestionOptions());

export const useUpdateQuestion = () => useMutation(useUpdateQuestionOptions());

export const useDeleteQuestion = () => useMutation(useDeleteQuestionOptions());

export const useReorderQuestions = () => useMutation(useReorderQuestionsOptions());

export const useCreateOption = () => useMutation(useCreateOptionOptions());

export const useUpdateOption = () => useMutation(useUpdateOptionOptions());

export const useDeleteOption = () => useMutation(useDeleteOptionOptions());
