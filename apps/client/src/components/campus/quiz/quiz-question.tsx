import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@learnbase/ui";
import { Badge } from "@learnbase/ui";
import type { Question } from "@/services/quizzes";
import { cn } from "@/lib/utils";

type QuizQuestionProps = {
  question: Question;
  index: number;
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  submitted: boolean;
  isCorrect: boolean | null;
  reviewMode?: boolean;
};

const TYPE_HINTS: Record<string, string> = {
  multiple_choice: "quizzes.hints.selectOne",
  multiple_select: "quizzes.hints.selectMultiple",
  true_false: "quizzes.hints.selectOne",
};

export function QuizQuestion({
  question,
  index,
  selectedOptionIds,
  onSelectOption,
  submitted,
  isCorrect,
  reviewMode = false,
}: QuizQuestionProps) {
  const { t } = useTranslation();
  const showResults = submitted || reviewMode;

  return (
    <Card
      className={cn(
        submitted &&
          (isCorrect
            ? "border-green-500/50 bg-green-500/5"
            : "border-red-500/50 bg-red-500/5"),
        reviewMode && "border-green-500/30"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{index}</Badge>
            {submitted && (
              <Badge variant={isCorrect ? "default" : "destructive"}>
                {isCorrect ? (
                  <Check className="mr-1 size-3" />
                ) : (
                  <X className="mr-1 size-3" />
                )}
                {isCorrect ? t("quizzes.player.correct") : t("quizzes.player.incorrect")}
              </Badge>
            )}
            {reviewMode && (
              <Badge variant="secondary">
                <Check className="mr-1 size-3" />
                {t("quizzes.player.reviewed")}
              </Badge>
            )}
          </div>
          {!showResults && (
            <span className="text-xs text-muted-foreground">
              {t(TYPE_HINTS[question.type])}
            </span>
          )}
        </div>
        <CardTitle className="text-base font-medium pt-2">
          {question.questionText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            const showAsCorrect = showResults && option.isCorrect;
            const showAsWrong = submitted && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => !showResults && onSelectOption(option.id)}
                disabled={showResults}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  !showResults && "hover:bg-muted/50 cursor-pointer",
                  !showResults && isSelected && "border-primary bg-primary/5",
                  showResults && "cursor-default",
                  showAsCorrect && "border-green-500 bg-green-500/10",
                  showAsWrong && "border-red-500 bg-red-500/10"
                )}
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center border-2",
                    question.type === "multiple_select" ? "rounded-sm" : "rounded-full",
                    !showResults && !isSelected && "border-muted-foreground/40",
                    !showResults && isSelected && "border-primary bg-primary text-primary-foreground",
                    showAsCorrect && "border-green-500 bg-green-500 text-white",
                    showAsWrong && "border-red-500 bg-red-500 text-white"
                  )}
                >
                  {((!showResults && isSelected) || showAsCorrect) && (
                    <Check className="size-3" />
                  )}
                </div>
                <span className="flex-1 text-sm">{option.optionText}</span>
              </button>
            );
          })}
        </div>

        {showResults && question.explanation && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{t("quizzes.player.explanation")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
