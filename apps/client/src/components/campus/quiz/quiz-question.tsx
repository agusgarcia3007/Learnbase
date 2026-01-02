import { useTranslation } from "react-i18next";
import { Check, X, Lightbulb } from "lucide-react";
import type { Question } from "@/services/quizzes";
import { cn } from "@/lib/utils";

type QuizQuestionProps = {
  question: Question;
  index: number;
  total: number;
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  onRadioChange: (optionId: string) => void;
  submitted: boolean;
  isCorrect: boolean | null;
  reviewMode?: boolean;
};

export function QuizQuestion({
  question,
  index,
  total,
  selectedOptionIds,
  onSelectOption,
  onRadioChange,
  submitted,
  isCorrect,
  reviewMode = false,
}: QuizQuestionProps) {
  const { t } = useTranslation();
  const showResults = submitted || reviewMode;
  const isMultiSelect = question.type === "multiple_select";

  const handleOptionClick = (optionId: string) => {
    if (showResults) return;
    if (isMultiSelect) {
      onSelectOption(optionId);
    } else {
      onRadioChange(optionId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          {t("quizzes.player.question", { current: index, total })}
        </span>
        {submitted && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              isCorrect
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}
          >
            {isCorrect ? (
              <>
                <Check className="size-3.5" />
                {t("quizzes.player.correct")}
              </>
            ) : (
              <>
                <X className="size-3.5" />
                {t("quizzes.player.incorrect")}
              </>
            )}
          </div>
        )}
      </div>

      <h2 className="text-center text-xl font-medium leading-relaxed whitespace-pre-wrap">
        {question.questionText}
      </h2>

      <div className="space-y-3 pt-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const showAsCorrect = showResults && option.isCorrect;
          const showAsWrong = submitted && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              disabled={showResults}
              className={cn(
                "w-full rounded-xl border-2 px-5 py-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                !showResults && "hover:border-primary/50 hover:bg-muted/50",
                !showResults && isSelected && "border-primary bg-primary/5",
                !showResults && !isSelected && "border-border",
                showResults && "cursor-default",
                showAsCorrect && "border-green-500/50 bg-green-500/5",
                showAsWrong && "border-red-400/50 bg-red-400/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    !showResults && !isSelected && "border-muted-foreground/30",
                    !showResults && isSelected && "border-primary bg-primary text-primary-foreground",
                    showAsCorrect && "border-green-500 bg-green-500 text-white",
                    showAsWrong && "border-red-400 bg-red-400 text-white"
                  )}
                >
                  {showAsCorrect && <Check className="size-3.5" />}
                  {showAsWrong && <X className="size-3.5" />}
                  {!showResults && isSelected && <Check className="size-3.5" />}
                </div>
                <span
                  className={cn(
                    "text-base",
                    showAsCorrect && "text-green-700 dark:text-green-400",
                    showAsWrong && "text-red-700 dark:text-red-400"
                  )}
                >
                  {option.optionText}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showResults && question.explanation && (
        <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium">{t("quizzes.player.explanation")}</p>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
