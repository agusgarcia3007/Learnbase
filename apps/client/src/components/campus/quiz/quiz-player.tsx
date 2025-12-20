import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuizQuestions, type Question } from "@/services/quizzes";
import { QuizQuestion } from "./quiz-question";
import { cn } from "@/lib/utils";

type QuizPlayerProps = {
  quizId: string;
  onComplete?: () => void;
  isCompleted?: boolean;
};

type Answer = {
  questionId: string;
  selectedOptionIds: string[];
};

export function QuizPlayer({ quizId, onComplete, isCompleted }: QuizPlayerProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuizQuestions(quizId);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const questions = data?.questions || [];

  const handleRadioChange = (questionId: string, optionId: string) => {
    if (submitted) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId
            ? { ...a, selectedOptionIds: [optionId] }
            : a
        );
      }
      return [...prev, { questionId, selectedOptionIds: [optionId] }];
    });
  };

  const handleCheckboxToggle = (questionId: string, optionId: string) => {
    if (submitted) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        const isSelected = existing.selectedOptionIds.includes(optionId);
        return prev.map((a) =>
          a.questionId === questionId
            ? {
                ...a,
                selectedOptionIds: isSelected
                  ? a.selectedOptionIds.filter((id) => id !== optionId)
                  : [...a.selectedOptionIds, optionId],
              }
            : a
        );
      }
      return [...prev, { questionId, selectedOptionIds: [optionId] }];
    });
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers([]);
    setSubmitted(false);
    setCurrentIndex(0);
  };

  const results = useMemo(() => {
    if (!submitted) return null;

    let correct = 0;
    const total = questions.length;

    questions.forEach((question) => {
      const answer = getAnswerForQuestion(question.id);
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();
      const selectedIds = (answer?.selectedOptionIds || []).sort();

      if (
        correctOptionIds.length === selectedIds.length &&
        correctOptionIds.every((id, i) => id === selectedIds[i])
      ) {
        correct++;
      }
    });

    return { correct, total, percentage: Math.round((correct / total) * 100) };
  }, [submitted, questions, answers]);

  const hasCalledComplete = useRef(false);

  useEffect(() => {
    if (results?.percentage === 100 && !isCompleted && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [results?.percentage, isCompleted, onComplete]);

  const isQuestionCorrect = (question: Question) => {
    if (!submitted) return null;
    const answer = getAnswerForQuestion(question.id);
    const correctOptionIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    const selectedIds = (answer?.selectedOptionIds || []).sort();
    return (
      correctOptionIds.length === selectedIds.length &&
      correctOptionIds.every((id, i) => id === selectedIds[i])
    );
  };

  const answeredCount = answers.filter(
    (a) => a.selectedOptionIds.length > 0
  ).length;
  const progress = (answeredCount / questions.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("quizzes.player.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isCompleted && !submitted && (
        <div className="rounded-lg bg-green-500/10 p-4 text-center text-green-700 dark:text-green-400">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="size-5" />
            {t("quizzes.player.completed")}
          </div>
        </div>
      )}

      {submitted && results && (
        <div
          className={cn(
            "rounded-lg p-4 text-center",
            results.percentage >= 70
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-orange-500/10 text-orange-700 dark:text-orange-400"
          )}
        >
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            {results.percentage >= 70 ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <XCircle className="size-5" />
            )}
            {t("quizzes.player.result", {
              correct: results.correct,
              total: results.total,
              percentage: results.percentage,
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("quizzes.player.retry")}
          </Button>
        </div>
      )}

      {!submitted && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("quizzes.player.progress", {
                answered: answeredCount,
                total: questions.length,
              })}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuizQuestion
            key={question.id}
            question={question}
            index={index + 1}
            selectedOptionIds={
              getAnswerForQuestion(question.id)?.selectedOptionIds || []
            }
            onSelectOption={(optionId) =>
              handleCheckboxToggle(question.id, optionId)
            }
            onRadioChange={(optionId) =>
              handleRadioChange(question.id, optionId)
            }
            submitted={submitted}
            isCorrect={isQuestionCorrect(question)}
            reviewMode={isCompleted && !submitted}
          />
        ))}
      </div>

      {!submitted && !isCompleted && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
          >
            {t("quizzes.player.submit")}
          </Button>
        </div>
      )}
    </div>
  );
}
