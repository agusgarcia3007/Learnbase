import { useEffect, useCallback } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { LearnLayout, LearnSkeleton, ItemNavigation } from "@/components/learn";
import { VideoContent } from "@/components/campus/content-viewer/video-content";
import { DocumentContent } from "@/components/campus/content-viewer/document-content";
import { QuizPlayer } from "@/components/campus/quiz/quiz-player";
import {
  useCourseStructure,
  useItemContent,
  useCompleteItem,
} from "@/services/learn";
import { useVideoProgress } from "@/hooks/use-video-progress";

type CourseSearch = {
  item?: string;
};

export const Route = createFileRoute("/my-courses/$courseSlug")({
  validateSearch: (search: Record<string, unknown>): CourseSearch => ({
    item: (search.item as string) || undefined,
  }),
  beforeLoad: () => {
    const isAuthenticated =
      typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: LearnPage,
});

function LearnPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseSlug } = Route.useParams();
  const { item: currentItemId } = Route.useSearch();

  const { data: structureData, isLoading: structureLoading } =
    useCourseStructure(courseSlug);

  const { data: contentData, isLoading: contentLoading } = useItemContent(
    currentItemId ?? ""
  );

  const { mutate: completeItem } = useCompleteItem(courseSlug);

  const { handleTimeUpdate, handlePause, reset: resetVideoProgress } =
    useVideoProgress(currentItemId ?? "");

  useEffect(() => {
    if (!currentItemId && structureData?.resumeItemId) {
      navigate({
        to: "/my-courses/$courseSlug",
        params: { courseSlug },
        search: { item: structureData.resumeItemId },
        replace: true,
      });
    }
  }, [currentItemId, structureData?.resumeItemId, courseSlug, navigate]);

  useEffect(() => {
    resetVideoProgress();
  }, [currentItemId, resetVideoProgress]);

  const handleItemSelect = useCallback(
    (itemId: string) => {
      navigate({
        to: "/my-courses/$courseSlug",
        params: { courseSlug },
        search: { item: itemId },
      });
    },
    [courseSlug, navigate]
  );

  const handleComplete = useCallback(() => {
    if (currentItemId) {
      completeItem(currentItemId);
    }
  }, [currentItemId, completeItem]);

  if (structureLoading) {
    return <LearnSkeleton />;
  }

  if (!structureData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>{t("learn.errors.notFound")}</EmptyTitle>
            <EmptyDescription>
              {t("learn.errors.notFoundDescription")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => navigate({ to: "/courses" })}>
              {t("learn.browseCourses")}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const { course, enrollment, modules } = structureData;

  return (
    <LearnLayout
      course={course}
      modules={modules}
      progress={enrollment.progress}
      currentItemId={currentItemId ?? null}
      onItemSelect={handleItemSelect}
    >
      {currentItemId ? (
        <div className="space-y-4">
          {contentLoading ? (
            <div className="bg-muted aspect-video animate-pulse rounded-xl" />
          ) : contentData?.type === "video" ? (
            <>
              <VideoContent
                src={contentData.url ?? ""}
                initialTime={contentData.videoProgress}
                onTimeUpdate={(time) => handleTimeUpdate(time)}
                onPause={(time) => handlePause(time)}
                onComplete={handleComplete}
                className="overflow-hidden rounded-xl shadow-lg"
              />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{contentData.title}</h2>
                {contentData.description && (
                  <p className="text-muted-foreground">
                    {contentData.description}
                  </p>
                )}
              </div>
            </>
          ) : contentData?.type === "document" ? (
            <>
              <DocumentContent
                src={contentData.url ?? ""}
                mimeType={contentData.mimeType ?? undefined}
                title={contentData.title}
                autoComplete
                onComplete={handleComplete}
              />
              {contentData.description && (
                <p className="text-muted-foreground mt-4">
                  {contentData.description}
                </p>
              )}
            </>
          ) : contentData?.type === "quiz" ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold">{contentData.title}</h2>
                {contentData.description && (
                  <p className="text-muted-foreground mt-2">
                    {contentData.description}
                  </p>
                )}
              </div>
              <QuizPlayer quizId={contentData.id} />
              <div className="flex justify-end pt-4">
                <Button onClick={handleComplete}>
                  {t("learn.completeQuiz")}
                </Button>
              </div>
            </div>
          ) : null}

          <ItemNavigation
            modules={modules}
            currentItemId={currentItemId}
            onNavigate={handleItemSelect}
          />
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle>{t("learn.selectContent")}</EmptyTitle>
              <EmptyDescription>
                {t("learn.selectContentDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </LearnLayout>
  );
}
