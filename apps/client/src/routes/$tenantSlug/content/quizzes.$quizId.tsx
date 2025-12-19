import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { QuizBuilder } from "@/components/quizzes";
import { useQuiz } from "@/services/quizzes";

export const Route = createFileRoute("/$tenantSlug/content/quizzes/$quizId")({
  component: QuizEditorPage,
});

function QuizEditorPage() {
  const { t } = useTranslation();
  const { tenantSlug, quizId } = Route.useParams();
  const { data: quiz, isLoading } = useQuiz(quizId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/$tenantSlug/content/quizzes" params={{ tenantSlug }}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{quiz?.title}</h1>
          <p className="text-muted-foreground">{t("quizzes.manageQuestions")}</p>
        </div>
      </div>

      <QuizBuilder quizId={quizId} />
    </div>
  );
}
