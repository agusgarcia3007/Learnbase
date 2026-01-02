import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Question } from "@/services/quizzes";
import { cn } from "@/lib/utils";

type QuizQuestionProps = {
  question: Question;
  index: number;
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  onRadioChange: (optionId: string) => void;
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
  onRadioChange,
  submitted,
  isCorrect,
  reviewMode = false,
}: QuizQuestionProps) {
  const { t } = useTranslation();
  const showResults = submitted || reviewMode;
  const isMultiSelect = question.type === "multiple_select";

  const renderOption = (option: (typeof question.options)[0]) => {
    const isSelected = selectedOptionIds.includes(option.id);
    const showAsCorrect = showResults && option.isCorrect;
    const showAsWrong = submitted && isSelected && !option.isCorrect;

    return (
      <Label
        key={option.id}
        htmlFor={option.id}
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
          !showResults && "hover:bg-muted/50",
          !showResults && isSelected && "border-primary bg-primary/5",
          showResults && "cursor-default",
          showAsCorrect && "border-green-500 bg-green-500/10",
          showAsWrong && "border-red-500 bg-red-500/10"
        )}
      >
        {isMultiSelect ? (
          <Checkbox
            id={option.id}
            checked={isSelected}
            onCheckedChange={() => onSelectOption(option.id)}
            disabled={showResults}
            className={cn(
              showAsCorrect && "border-green-500 data-[state=checked]:bg-green-500",
              showAsWrong && "border-red-500 data-[state=checked]:bg-red-500"
            )}
          />
        ) : (
          <RadioGroupItem
            id={option.id}
            value={option.id}
            disabled={showResults}
            className={cn(
              showAsCorrect && "border-green-500 text-green-500",
              showAsWrong && "border-red-500 text-red-500"
            )}
          />
        )}
        <span className="flex-1 text-sm">{option.optionText}</span>
        {showResults && (
          <>
            {showAsCorrect && <Check className="size-4 text-green-500" />}
            {showAsWrong && <X className="size-4 text-red-500" />}
          </>
        )}
      </Label>
    );
  };

  return (
    <Card
      className={cn(
        "w-full",
        submitted &&
          (isCorrect
            ? "border-green-500/50 bg-green-500/5"
            : "border-red-500/50 bg-red-500/5"),
        reviewMode && "border-green-500/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="shrink-0">{index}</Badge>
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
        <CardTitle className="text-base font-medium mt-3">
          {question.questionText}
        </CardTitle>
        {!showResults && (
          <p className="text-xs text-muted-foreground mt-1">
            {t(TYPE_HINTS[question.type])}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isMultiSelect ? (
          <div className="space-y-2">
            {question.options.map(renderOption)}
          </div>
        ) : (
          <RadioGroup
            value={selectedOptionIds[0] || ""}
            onValueChange={onRadioChange}
            disabled={showResults}
            className="space-y-2"
          >
            {question.options.map(renderOption)}
          </RadioGroup>
        )}

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
