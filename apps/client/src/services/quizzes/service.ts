import { http } from "@/lib/http";

export type QuizListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  createdAt?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContentStatus = "draft" | "published";

export type Quiz = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionType = "multiple_choice" | "multiple_select";

export type Option = {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
};

export type Question = {
  id: string;
  quizId: string;
  tenantId: string;
  type: QuestionType;
  questionText: string;
  explanation: string | null;
  order: number;
  options: Option[];
  createdAt: string;
  updatedAt: string;
};

export type CreateQuizRequest = {
  title: string;
  description?: string;
  status?: ContentStatus;
};

export type UpdateQuizRequest = {
  title?: string;
  description?: string | null;
  status?: ContentStatus;
};

export type CreateQuestionRequest = {
  type: QuestionType;
  questionText: string;
  explanation?: string;
  options?: {
    optionText: string;
    isCorrect: boolean;
  }[];
};

export type UpdateQuestionRequest = {
  type?: QuestionType;
  questionText?: string;
  explanation?: string | null;
  order?: number;
};

export type CreateOptionRequest = {
  optionText: string;
  isCorrect: boolean;
};

export type UpdateOptionRequest = {
  optionText?: string;
  isCorrect?: boolean;
  order?: number;
};

export const QUERY_KEYS = {
  QUIZZES: ["quizzes"],
  QUIZZES_LIST: (params?: QuizListParams) => ["quizzes", "list", params ?? {}],
  QUIZ: (id: string) => ["quizzes", id],
  QUIZ_QUESTIONS: (quizId: string) => ["quizzes", "questions", quizId],
} as const;

export const QuizzesService = {
  async list(params: QuizListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.createdAt) searchParams.set("createdAt", params.createdAt);

    const queryString = searchParams.toString();
    const url = queryString ? `/quizzes?${queryString}` : "/quizzes";
    const { data } = await http.get<{ quizzes: Quiz[]; pagination: PaginationMeta }>(url);
    return data;
  },

  async getById(id: string) {
    const { data } = await http.get<{ quiz: Quiz }>(`/quizzes/${id}`);
    return data;
  },

  async create(payload: CreateQuizRequest) {
    const { data } = await http.post<{ quiz: Quiz }>("/quizzes", payload);
    return data;
  },

  async update(id: string, payload: UpdateQuizRequest) {
    const { data } = await http.put<{ quiz: Quiz }>(`/quizzes/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await http.delete<{ success: boolean }>(`/quizzes/${id}`);
    return data;
  },

  async bulkDelete(ids: string[]) {
    const { data } = await http.delete<{ success: boolean; deleted: number }>(
      "/quizzes/bulk",
      { data: { ids } }
    );
    return data;
  },

  async getQuestions(quizId: string) {
    const { data } = await http.get<{ questions: Question[] }>(
      `/quizzes/${quizId}/questions`
    );
    return data;
  },

  async createQuestion(quizId: string, payload: CreateQuestionRequest) {
    const { data } = await http.post<{ question: Question }>(
      `/quizzes/${quizId}/questions`,
      payload
    );
    return data;
  },

  async updateQuestion(questionId: string, payload: UpdateQuestionRequest) {
    const { data } = await http.put<{ question: Question }>(
      `/quizzes/questions/${questionId}`,
      payload
    );
    return data;
  },

  async deleteQuestion(questionId: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/quizzes/questions/${questionId}`
    );
    return data;
  },

  async reorderQuestions(quizId: string, questionIds: string[]) {
    const { data } = await http.put<{ success: boolean }>(
      `/quizzes/${quizId}/questions/reorder`,
      { questionIds }
    );
    return data;
  },

  async createOption(questionId: string, payload: CreateOptionRequest) {
    const { data } = await http.post<{ option: Option }>(
      `/quizzes/questions/${questionId}/options`,
      payload
    );
    return data;
  },

  async updateOption(optionId: string, payload: UpdateOptionRequest) {
    const { data } = await http.put<{ option: Option }>(
      `/quizzes/options/${optionId}`,
      payload
    );
    return data;
  },

  async deleteOption(optionId: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/quizzes/options/${optionId}`
    );
    return data;
  },
} as const;
