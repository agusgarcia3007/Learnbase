import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  Question,
  QuestionType,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "@/services/quizzes";

type QuestionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  onSubmit: (data: CreateQuestionRequest | UpdateQuestionRequest) => void;
  isPending?: boolean;
};

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "quizzes.types.multiple_choice" },
  { value: "multiple_select", label: "quizzes.types.multiple_select" },
];

type OptionInput = {
  id: string;
  optionText: string;
  isCorrect: boolean;
};

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  onSubmit,
  isPending,
}: QuestionFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!question;

  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([]);

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === "multiple_choice" && type === "multiple_select") {
      const correctOptions = options.filter((o) => o.isCorrect);
      if (correctOptions.length > 1) {
        const firstCorrectId = correctOptions[0].id;
        setOptions(
          options.map((o) => ({
            ...o,
            isCorrect: o.id === firstCorrectId,
          }))
        );
      }
    }
    setType(newType);
  };

   
  useEffect(() => {
    if (open) {
      if (question) {
        setType(question.type);
        setQuestionText(question.questionText);
        setExplanation(question.explanation || "");
        setOptions(
          question.options.map((o) => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
          }))
        );
      } else {
        setType("multiple_choice");
        setQuestionText("");
        setExplanation("");
        setOptions([
          { id: crypto.randomUUID(), optionText: "", isCorrect: false },
          { id: crypto.randomUUID(), optionText: "", isCorrect: false },
        ]);
      }
    }
  }, [open, question]);
   


  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: crypto.randomUUID(), optionText: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionChange = (
    id: string,
    field: "optionText" | "isCorrect",
    value: string | boolean
  ) => {
    if (field === "isCorrect" && value === true && type === "multiple_choice") {
      setOptions(
        options.map((o) => ({
          ...o,
          isCorrect: o.id === id,
        }))
      );
    } else {
      setOptions(
        options.map((o) => (o.id === id ? { ...o, [field]: value } : o))
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      onSubmit({
        type,
        questionText,
        explanation: explanation || undefined,
      } as UpdateQuestionRequest);
    } else {
      const validOptions = options.filter((o) => o.optionText.trim());
      onSubmit({
        type,
        questionText,
        explanation: explanation || undefined,
        options: validOptions.map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      } as CreateQuestionRequest);
    }
  };

  const hasValidOptions = options.filter((o) => o.optionText.trim()).length >= 2;
  const canSubmit = questionText.trim() && (isEditing || hasValidOptions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("quizzes.question.edit")
              : t("quizzes.question.create")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("quizzes.question.editDescription")
              : t("quizzes.question.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("quizzes.fields.type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => handleTypeChange(v as QuestionType)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>
                    {t(qt.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">
              {t("quizzes.fields.questionText")}
            </Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={t("quizzes.fields.questionTextPlaceholder")}
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">
              {t("quizzes.fields.explanation")}
            </Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={t("quizzes.fields.explanationPlaceholder")}
              disabled={isPending}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              {t("quizzes.fields.explanationHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("quizzes.fields.options")}</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) =>
                      handleOptionChange(option.id, "isCorrect", !!checked)
                    }
                    disabled={isPending || isEditing}
                  />
                  <Input
                    value={option.optionText}
                    onChange={(e) =>
                      handleOptionChange(
                        option.id,
                        "optionText",
                        e.target.value
                      )
                    }
                    placeholder={t("quizzes.fields.optionPlaceholder", {
                      index: index + 1,
                    })}
                    disabled={isPending || isEditing}
                    className="flex-1"
                  />
                  {options.length > 2 && !isEditing && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive"
                      onClick={() => handleRemoveOption(option.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={isPending}
              >
                <Plus className="mr-1 size-4" />
                {t("quizzes.options.add")}
              </Button>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                {t("quizzes.fields.optionsReadOnly")}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending} disabled={!canSubmit}>
              {isEditing ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
