import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateOption,
  useUpdateOption,
  useDeleteOption,
  type Question,
  type Option,
} from "@/services/quizzes";
import { cn } from "@/lib/utils";

type QuestionCardProps = {
  question: Question;
  index: number;
  quizId: string;
  onEdit: () => void;
  onDelete: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "quizzes.types.multipleChoice",
  multiple_select: "quizzes.types.multipleSelect",
  true_false: "quizzes.types.trueFalse",
};

export function QuestionCard({
  question,
  index,
  quizId,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionText, setEditingOptionText] = useState("");

  const createOption = useCreateOption();
  const updateOption = useUpdateOption();
  const deleteOption = useDeleteOption();

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    createOption.mutate(
      {
        questionId: question.id,
        quizId,
        optionText: newOptionText,
        isCorrect: false,
      },
      {
        onSuccess: () => setNewOptionText(""),
      }
    );
  };

  const handleToggleCorrect = (option: Option) => {
    updateOption.mutate({
      optionId: option.id,
      quizId,
      isCorrect: !option.isCorrect,
    });
  };

  const handleStartEditOption = (option: Option) => {
    setEditingOptionId(option.id);
    setEditingOptionText(option.optionText);
  };

  const handleSaveOptionEdit = (optionId: string) => {
    if (!editingOptionText.trim()) return;
    updateOption.mutate(
      {
        optionId,
        quizId,
        optionText: editingOptionText,
      },
      {
        onSuccess: () => {
          setEditingOptionId(null);
          setEditingOptionText("");
        },
      }
    );
  };

  const handleDeleteOption = (optionId: string) => {
    deleteOption.mutate({ optionId, quizId });
  };

  const correctCount = question.options.filter((o) => o.isCorrect).length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="shrink-0">
                  {index}
                </Badge>
                <Badge variant="secondary" className="shrink-0">
                  {t(TYPE_LABELS[question.type] || question.type)}
                </Badge>
              </div>
              <CardTitle className="text-base font-medium">
                {question.questionText}
              </CardTitle>
              {question.explanation && (
                <CardDescription className="mt-1 text-xs">
                  {question.explanation}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 size-4" />
                    {t("common.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t("quizzes.options.title")} ({question.options.length})
                </span>
                <span>
                  {t("quizzes.options.correct", { count: correctCount })}
                </span>
              </div>

              <div className="space-y-1">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-2",
                      option.isCorrect && "border-green-500/50 bg-green-500/5"
                    )}
                  >
                    <Checkbox
                      checked={option.isCorrect}
                      onCheckedChange={() => handleToggleCorrect(option)}
                    />
                    {editingOptionId === option.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editingOptionText}
                          onChange={(e) => setEditingOptionText(e.target.value)}
                          className="h-8 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveOptionEdit(option.id);
                            }
                            if (e.key === "Escape") {
                              setEditingOptionId(null);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => handleSaveOptionEdit(option.id)}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setEditingOptionId(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">
                          {option.optionText}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => handleStartEditOption(option)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder={t("quizzes.options.addPlaceholder")}
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddOption}
                  disabled={!newOptionText.trim() || createOption.isPending}
                >
                  <Plus className="mr-1 size-4" />
                  {t("common.add")}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
