import { useMutation } from "@tanstack/react-query";
import {
  createQuizOptions,
  updateQuizOptions,
  deleteQuizOptions,
  bulkDeleteQuizzesOptions,
  createQuestionOptions,
  updateQuestionOptions,
  deleteQuestionOptions,
  reorderQuestionsOptions,
  createOptionOptions,
  updateOptionOptions,
  deleteOptionOptions,
} from "./options";

export const useCreateQuiz = () => useMutation(createQuizOptions());

export const useUpdateQuiz = () => useMutation(updateQuizOptions());

export const useDeleteQuiz = () => useMutation(deleteQuizOptions());

export const useBulkDeleteQuizzes = () => useMutation(bulkDeleteQuizzesOptions());

export const useCreateQuestion = () => useMutation(createQuestionOptions());

export const useUpdateQuestion = () => useMutation(updateQuestionOptions());

export const useDeleteQuestion = () => useMutation(deleteQuestionOptions());

export const useReorderQuestions = () => useMutation(reorderQuestionsOptions());

export const useCreateOption = () => useMutation(createOptionOptions());

export const useUpdateOption = () => useMutation(updateOptionOptions());

export const useDeleteOption = () => useMutation(deleteOptionOptions());
