import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Sparkles, Trash2, Video } from "lucide-react";
import { Button } from "@learnbase/ui";
import { Badge } from "@learnbase/ui";
import { Checkbox } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Input } from "@learnbase/ui";
import { Label } from "@learnbase/ui";
import { RadioGroup, RadioGroupItem } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@learnbase/ui";
import { useVideosList } from "@/services/videos";
import { useDocumentsList } from "@/services/documents";
import {
  useGenerateQuizQuestions,
  type GeneratedQuestion,
} from "@/services/ai";
import { useCreateQuestion, type CreateQuestionRequest } from "@/services/quizzes";

type AIGenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
};

type EditableQuestion = GeneratedQuestion & { id: string };

export function AIGenerateDialog({
  open,
  onOpenChange,
  quizId,
}: AIGenerateDialogProps) {
  const { t } = useTranslation();

  const [sourceType, setSourceType] = useState<"video" | "document">("video");
  const [sourceId, setSourceId] = useState<string>("");
  const [count, setCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<EditableQuestion[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: videosData, isLoading: videosLoading } = useVideosList({ limit: 100 });
  const { data: documentsData, isLoading: documentsLoading } = useDocumentsList({ limit: 100 });

  const generateMutation = useGenerateQuizQuestions();
  const createQuestion = useCreateQuestion();

  const videos = videosData?.videos.filter((v) => v.videoKey) || [];
  const documents = documentsData?.documents.filter((d) => d.fileKey) || [];

  const handleGenerate = () => {
    generateMutation.mutate(
      { quizId, sourceType, sourceId, count },
      {
        onSuccess: (data) => {
          setGeneratedQuestions(
            data.questions.map((q) => ({ ...q, id: crypto.randomUUID() }))
          );
          setIsPreviewMode(true);
        },
      }
    );
  };

  const handleQuestionChange = (
    id: string,
    field: "questionText" | "explanation",
    value: string
  ) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (
    questionId: string,
    optionIndex: number,
    field: "optionText" | "isCorrect",
    value: string | boolean
  ) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: q.options.map((o, i) =>
            i === optionIndex ? { ...o, [field]: value } : o
          ),
        };
      })
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);

    for (const question of generatedQuestions) {
      const payload: CreateQuestionRequest = {
        type: question.type,
        questionText: question.questionText,
        explanation: question.explanation || undefined,
        options: question.options.map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      };

      await new Promise<void>((resolve) => {
        createQuestion.mutate(
          { quizId, ...payload },
          { onSettled: () => resolve() }
        );
      });
    }

    setIsSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setSourceType("video");
    setSourceId("");
    setCount(5);
    setGeneratedQuestions([]);
    setIsPreviewMode(false);
    onOpenChange(false);
  };

  const handleBack = () => {
    setIsPreviewMode(false);
    setGeneratedQuestions([]);
  };

  const canGenerate = sourceId && count >= 1 && count <= 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {generateMutation.isPending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/90 backdrop-blur-sm">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-1/2 animate-[shimmer-slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
            <p className="text-sm font-medium text-primary">
              {t("quizzes.ai.generating")}
            </p>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            {isPreviewMode
              ? t("quizzes.ai.previewTitle")
              : t("quizzes.ai.generateTitle")}
          </DialogTitle>
          <DialogDescription>
            {isPreviewMode
              ? t("quizzes.ai.previewDescription")
              : t("quizzes.ai.generateDescription")}
          </DialogDescription>
        </DialogHeader>

        {!isPreviewMode ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>{t("quizzes.ai.sourceType")}</Label>
              <RadioGroup
                value={sourceType}
                onValueChange={(v) => {
                  setSourceType(v as "video" | "document");
                  setSourceId("");
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                    <Video className="size-4" />
                    {t("quizzes.ai.sourceVideo")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="document" id="document" />
                  <Label htmlFor="document" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="size-4" />
                    {t("quizzes.ai.sourceDocument")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>{t("quizzes.ai.selectSource")}</Label>
              <Select
                value={sourceId}
                onValueChange={setSourceId}
                disabled={videosLoading || documentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("quizzes.ai.selectSourcePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {sourceType === "video" ? (
                    videos.length > 0 ? (
                      videos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_none" disabled>
                        {t("quizzes.ai.noContent")}
                      </SelectItem>
                    )
                  ) : documents.length > 0 ? (
                    documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>
                      {t("quizzes.ai.noContent")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                {t("quizzes.ai.questionCount")}: {count}
              </Label>
              <Slider
                value={[count]}
                onValueChange={([v]) => setCount(v)}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || generateMutation.isPending}
              >
                <Sparkles className="mr-2 size-4" />
                {t("quizzes.ai.generateButton")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {generatedQuestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("quizzes.ai.noQuestionsGenerated")}
              </p>
            ) : (
              <div className="space-y-4">
                {generatedQuestions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="rounded-lg border-2 border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{qIndex + 1}</Badge>
                        <Badge variant="secondary">
                          {t(`quizzes.types.${question.type}`)}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <Textarea
                      value={question.questionText}
                      onChange={(e) =>
                        handleQuestionChange(question.id, "questionText", e.target.value)
                      }
                      placeholder={t("quizzes.fields.questionText")}
                      rows={2}
                    />

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={(checked) =>
                              handleOptionChange(
                                question.id,
                                oIndex,
                                "isCorrect",
                                !!checked
                              )
                            }
                          />
                          <Input
                            value={option.optionText}
                            onChange={(e) =>
                              handleOptionChange(
                                question.id,
                                oIndex,
                                "optionText",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>

                    <Textarea
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionChange(question.id, "explanation", e.target.value)
                      }
                      placeholder={t("quizzes.fields.explanation")}
                      rows={1}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleBack}>
                {t("common.back")}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={generatedQuestions.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("quizzes.ai.addQuestions", { count: generatedQuestions.length })
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
