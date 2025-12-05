import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useQuizQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useReorderQuestions,
  type Question,
  type CreateQuestionRequest,
  type UpdateQuestionRequest,
} from "@/services/quizzes";
import { QuestionList } from "./question-list";
import { QuestionFormDialog } from "./question-form-dialog";

type QuizBuilderProps = {
  quizId: string;
};

export function QuizBuilder({ quizId }: QuizBuilderProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data, isLoading } = useQuizQuestions(quizId);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const reorderQuestions = useReorderQuestions();

  const questions = data?.questions || [];

  const handleCreateQuestion = (payload: CreateQuestionRequest) => {
    createQuestion.mutate(
      { quizId, ...payload },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  };

  const handleUpdateQuestion = (payload: UpdateQuestionRequest) => {
    if (!editingQuestion) return;
    updateQuestion.mutate(
      { questionId: editingQuestion.id, quizId, ...payload },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingQuestion(null);
        },
      }
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion.mutate({ questionId, quizId });
  };

  const handleReorder = (questionIds: string[]) => {
    reorderQuestions.mutate({ quizId, questionIds });
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("quizzes.builder.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("quizzes.builder.description", { count: questions.length })}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("quizzes.question.add")}
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("quizzes.builder.empty")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            {t("quizzes.question.addFirst")}
          </Button>
        </div>
      ) : (
        <QuestionList
          questions={questions}
          quizId={quizId}
          onEdit={handleEdit}
          onDelete={handleDeleteQuestion}
          onReorder={handleReorder}
        />
      )}

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        question={editingQuestion}
        onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
        isPending={createQuestion.isPending || updateQuestion.isPending}
      />
    </div>
  );
}
