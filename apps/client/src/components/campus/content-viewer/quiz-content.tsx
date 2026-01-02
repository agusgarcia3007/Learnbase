import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type QuizOption = {
  id: string;
  text: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  type: "multiple_choice" | "multiple_select" | "true_false";
  options: QuizOption[];
};

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  questionsNumber?: number;
};

type QuizContentProps = {
  quiz: Quiz;
  onComplete?: (score: number) => void;
  className?: string;
};

export function QuizContent({ quiz, className }: QuizContentProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold">{quiz.title}</h2>
        {quiz.description && (
          <p className="mt-2 text-muted-foreground whitespace-pre-line">{quiz.description}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {t("contentViewer.quiz.questions", {
              count: quiz.questionsNumber ?? quiz.questions.length,
            })}
          </span>
        </div>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>{t("contentViewer.quiz.comingSoon")}</EmptyTitle>
          <EmptyDescription>
            {t("contentViewer.quiz.comingSoonDescription")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
