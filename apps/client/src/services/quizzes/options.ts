import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  QuizzesService,
  QUERY_KEYS,
  type QuizListParams,
  type CreateQuizRequest,
  type UpdateQuizRequest,
  type CreateQuestionRequest,
  type UpdateQuestionRequest,
  type CreateOptionRequest,
  type UpdateOptionRequest,
  type Question,
} from "./service";

export const quizzesListOptions = (params?: QuizListParams) =>
  queryOptions({
    queryFn: () => QuizzesService.list(params),
    queryKey: QUERY_KEYS.QUIZZES_LIST(params),
  });

export const quizOptions = (id: string) =>
  queryOptions({
    queryFn: () => QuizzesService.getById(id),
    queryKey: QUERY_KEYS.QUIZ(id),
    enabled: !!id,
  });

export const quizQuestionsOptions = (quizId: string) =>
  queryOptions({
    queryFn: () => QuizzesService.getQuestions(quizId),
    queryKey: QUERY_KEYS.QUIZ_QUESTIONS(quizId),
    enabled: !!quizId,
  });

export const useCreateQuizOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateQuizRequest) => QuizzesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      toast.success(i18n.t("quizzes.createSuccess"));
    },
  });
};

export const useUpdateQuizOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateQuizRequest) =>
      QuizzesService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(id) });
      toast.success(i18n.t("quizzes.updateSuccess"));
    },
  });
};

export const useDeleteQuizOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => QuizzesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      toast.success(i18n.t("quizzes.deleteSuccess"));
    },
  });
};

export const useBulkDeleteQuizzesOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (ids: string[]) => QuizzesService.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      toast.success(i18n.t("quizzes.bulkDelete.success", { count: ids.length }));
    },
  });
};

export const useCreateQuestionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      quizId,
      ...payload
    }: { quizId: string } & CreateQuestionRequest) =>
      QuizzesService.createQuestion(quizId, payload),
    onSuccess: (data, { quizId }) => {
      queryClient.setQueryData(
        QUERY_KEYS.QUIZ_QUESTIONS(quizId),
        (old: { questions: Question[] } | undefined) => ({
          questions: old?.questions
            ? [...old.questions, data.question]
            : [data.question],
        })
      );
      toast.success(i18n.t("quizzes.question.createSuccess"));
    },
  });
};

export const useUpdateQuestionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      questionId,
      ...payload
    }: { questionId: string; quizId: string } & UpdateQuestionRequest) =>
      QuizzesService.updateQuestion(questionId, payload),
    onSuccess: (data, { quizId }) => {
      queryClient.setQueryData(
        QUERY_KEYS.QUIZ_QUESTIONS(quizId),
        (old: { questions: Question[] } | undefined) => ({
          questions:
            old?.questions.map((q) =>
              q.id === data.question.id ? data.question : q
            ) ?? [],
        })
      );
      toast.success(i18n.t("quizzes.question.updateSuccess"));
    },
  });
};

export const useDeleteQuestionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      questionId,
    }: {
      questionId: string;
      quizId: string;
    }) => QuizzesService.deleteQuestion(questionId),
    onSuccess: (_, { questionId, quizId }) => {
      queryClient.setQueryData(
        QUERY_KEYS.QUIZ_QUESTIONS(quizId),
        (old: { questions: Question[] } | undefined) => ({
          questions: old?.questions.filter((q) => q.id !== questionId) ?? [],
        })
      );
      toast.success(i18n.t("quizzes.question.deleteSuccess"));
    },
  });
};

export const useReorderQuestionsOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      quizId,
      questionIds,
    }: {
      quizId: string;
      questionIds: string[];
    }) => QuizzesService.reorderQuestions(quizId, questionIds),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUIZ_QUESTIONS(quizId),
      });
    },
  });
};

export const useCreateOptionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      questionId,
      ...payload
    }: { questionId: string; quizId: string } & CreateOptionRequest) =>
      QuizzesService.createOption(questionId, payload),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUIZ_QUESTIONS(quizId),
      });
    },
  });
};

export const useUpdateOptionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({
      optionId,
      ...payload
    }: { optionId: string; quizId: string } & UpdateOptionRequest) =>
      QuizzesService.updateOption(optionId, payload),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUIZ_QUESTIONS(quizId),
      });
    },
  });
};

export const useDeleteOptionOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ optionId }: { optionId: string; quizId: string }) =>
      QuizzesService.deleteOption(optionId),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUIZ_QUESTIONS(quizId),
      });
    },
  });
};
