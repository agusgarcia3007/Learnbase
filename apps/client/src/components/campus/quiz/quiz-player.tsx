import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = data?.questions || [];
  const currentQuestion = questions[currentIndex];

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
    setCurrentIndex(0);
  };

  const handleReset = () => {
    setAnswers([]);
    setSubmitted(false);
    setCurrentIndex(0);
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

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

  const isCurrentAnswered = currentQuestion
    ? (getAnswerForQuestion(currentQuestion.id)?.selectedOptionIds.length ?? 0) > 0
    : false;

  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = answeredCount === questions.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
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
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {isCompleted && !submitted && (
        <div className="rounded-xl bg-green-500/10 p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-5" />
            {t("quizzes.player.completed")}
          </div>
        </div>
      )}

      {submitted && results && (
        <div
          className={cn(
            "rounded-xl p-6 text-center",
            results.percentage >= 70
              ? "bg-green-500/10"
              : "bg-orange-500/10"
          )}
        >
          <div
            className={cn(
              "text-4xl font-semibold",
              results.percentage >= 70
                ? "text-green-700 dark:text-green-400"
                : "text-orange-700 dark:text-orange-400"
            )}
          >
            {results.percentage}%
          </div>
          <p className="mt-2 text-muted-foreground">
            {t("quizzes.player.result", {
              correct: results.correct,
              total: results.total,
              percentage: results.percentage,
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("quizzes.player.retry")}
          </Button>
        </div>
      )}

      {currentQuestion && (
        <div className="transition-opacity duration-200">
          <QuizQuestion
            question={currentQuestion}
            index={currentIndex + 1}
            total={questions.length}
            selectedOptionIds={
              getAnswerForQuestion(currentQuestion.id)?.selectedOptionIds || []
            }
            onSelectOption={(optionId) =>
              handleCheckboxToggle(currentQuestion.id, optionId)
            }
            onRadioChange={(optionId) =>
              handleRadioChange(currentQuestion.id, optionId)
            }
            submitted={submitted}
            isCorrect={isQuestionCorrect(currentQuestion)}
            reviewMode={isCompleted && !submitted}
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = (getAnswerForQuestion(q.id)?.selectedOptionIds.length ?? 0) > 0;
          const isCurrent = i === currentIndex;
          const questionCorrect = submitted ? isQuestionCorrect(q) : null;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "size-2.5 rounded-full transition-all",
                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                !submitted && isAnswered && "bg-primary",
                !submitted && !isAnswered && "bg-muted-foreground/30",
                submitted && questionCorrect === true && "bg-green-500",
                submitted && questionCorrect === false && "bg-red-400"
              )}
              aria-label={t("quizzes.player.goToQuestion", { number: i + 1 })}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          {t("common.previous")}
        </Button>

        {!submitted && !isCompleted && isLastQuestion && allAnswered ? (
          <Button onClick={handleSubmit}>
            {t("quizzes.player.submit")}
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={isLastQuestion}
            className="gap-1"
          >
            {t("common.next")}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
