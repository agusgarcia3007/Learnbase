import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DualSidebarProvider,
  DualSidebarInset,
} from "@/components/ui/dual-sidebar";
import { CampusHeader } from "@/components/campus/header";
import { LearnContentSidebar } from "@/components/learn/learn-content-sidebar";
import { AIChatSidebar } from "@/components/learn/ai-chat-sidebar";
import { CourseCompletedView } from "@/components/learn/course-completed-view";
import { ItemNavigation } from "@/components/learn";
import { VideoContent } from "@/components/campus/content-viewer/video-content";
import { DocumentContent } from "@/components/campus/content-viewer/document-content";
import { QuizPlayer } from "@/components/campus/quiz/quiz-player";
import {
  useCourseStructure,
  useCourseProgress,
  useItemContent,
  useCompleteItem,
} from "@/services/learn";
import { useCampusTenant } from "@/services/campus/queries";
import { useVideoProgress } from "@/hooks/use-video-progress";
import { useTheme } from "@/components/ui/theme-provider";
import { useCustomTheme, getFontStyles } from "@/hooks/use-custom-theme";
import { createSeoMeta } from "@/lib/seo";
import { LearnService } from "@/services/learn/service";

type CourseSearch = {
  item?: string;
};

export const Route = createFileRoute("/my-courses/$courseSlug")({
  validateSearch: (search: Record<string, unknown>): CourseSearch => ({
    item: (search.item as string) || undefined,
  }),
  loader: async ({ params }) => {
    try {
      const data = await LearnService.getCourseStructure(params.courseSlug);
      return { course: data.course };
    } catch {
      return { course: null };
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.course) {
      return {
        meta: [{ title: "Course Not Found | LearnBase" }],
      };
    }

    const { course } = loaderData;
    return createSeoMeta({
      title: course.title,
      description: course.description,
    });
  },
  component: LearnPageWrapper,
});

function LearnPageWrapper() {
  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const tenant = tenantData?.tenant;
  const usePresetTheme = tenant?.theme !== null && tenant?.theme !== undefined;
  const { customStyles: colorStyles } = useCustomTheme(usePresetTheme ? null : tenant?.customTheme);
  const fontStyles = getFontStyles(tenant?.customTheme);
  const customStyles = colorStyles ? { ...colorStyles, ...fontStyles } : fontStyles;

  const themeClass = usePresetTheme ? `theme-${tenant.theme}` : "";

  if (tenantLoading || !tenant) {
    return <PageSkeleton />;
  }

  return (
    <DualSidebarProvider
      defaultLeftOpen={true}
      defaultRightOpen={false}
      className={themeClass}
      style={customStyles}
    >
      <LearnPage tenant={tenant} />
    </DualSidebarProvider>
  );
}

type LearnPageProps = {
  tenant: NonNullable<ReturnType<typeof useCampusTenant>["data"]>["tenant"];
};

function LearnPage({ tenant }: LearnPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { courseSlug } = Route.useParams();
  const { item: currentItemId } = Route.useSearch();
  const [isReviewing, setIsReviewing] = useState(false);
  const [justCompletedCourse, setJustCompletedCourse] = useState(false);

  const { data: structureData, isLoading: structureLoading } =
    useCourseStructure(courseSlug);

  const { data: progressData } = useCourseProgress(courseSlug);

  const { data: contentData, isLoading: contentLoading } = useItemContent(
    currentItemId ?? ""
  );

  const { mutate: completeItem } = useCompleteItem(courseSlug);

  const isCourseCompleted = structureData?.enrollment.status === "completed";

  const { handleTimeUpdate, handlePause, handleSeeked, reset: resetVideoProgress } =
    useVideoProgress({
      moduleItemId: currentItemId ?? "",
      isCompleted: isCourseCompleted,
    });

  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const currentVideoTimeRef = useRef(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  const currentModuleId = useMemo(() => {
    if (!currentItemId || !progressData?.itemIds) return null;
    const item = progressData.itemIds.find((i) => i.id === currentItemId);
    return item?.moduleId ?? null;
  }, [currentItemId, progressData?.itemIds]);

  useEffect(() => {
    const tenantMode = tenant?.mode;
    if (tenantMode === "light" || tenantMode === "dark") {
      setTheme(tenantMode);
    } else if (tenantMode === "auto") {
      setTheme("system");
    }
  }, [tenant?.mode, setTheme]);

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
    setJustCompletedCourse(false);
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
      completeItem(currentItemId, {
        onSuccess: (data) => {
          if (data.courseCompleted) {
            setJustCompletedCourse(true);
          }
        },
      });
    }
  }, [currentItemId, completeItem]);

  const handleVideoTimeUpdate = useCallback(
    (time: number) => {
      handleTimeUpdate(time);
      currentVideoTimeRef.current = time;
      if (Math.abs(time - currentVideoTime) >= 1) {
        setCurrentVideoTime(time);
      }
    },
    [handleTimeUpdate, currentVideoTime]
  );

  if (structureLoading) {
    return (
      <>
        <CampusHeader tenant={tenant} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <LearnPageSkeleton />
        </main>
      </>
    );
  }

  if (!structureData) {
    return (
      <>
        <CampusHeader tenant={tenant} />
        <main className="flex min-h-0 flex-1 items-center justify-center">
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
        </main>
      </>
    );
  }

  const { enrollment, modules, course } = structureData;
  const showCompletedView = enrollment.status === "completed" && !isReviewing && !justCompletedCourse;

  return (
    <>
      <CampusHeader tenant={tenant} />

      <div className="flex min-h-0 flex-1">
        <LearnContentSidebar
          courseSlug={courseSlug}
          modules={modules}
          enrollmentProgress={enrollment.progress}
          currentItemId={currentItemId ?? null}
          currentModuleId={currentModuleId}
          onItemSelect={handleItemSelect}
        />

        <LearnMainContent>
          {showCompletedView ? (
            <CourseCompletedView
              course={course}
              enrollmentId={enrollment.id}
              onReviewCourse={() => setIsReviewing(true)}
            />
          ) : (
            <div className="mx-auto max-w-9xl px-4 py-6 lg:px-8">
              {currentItemId ? (
                <div className="space-y-4">
                  {contentLoading ? (
                    <div className="bg-muted aspect-video animate-pulse rounded-xl" />
                  ) : contentData?.type === "video" ? (
                    <>
                      <VideoContent
                        src={contentData.url ?? ""}
                        initialTime={contentData.videoProgress}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onPause={(time) => handlePause(time)}
                        onSeeked={handleSeeked}
                        onComplete={handleComplete}
                        onVideoRefReady={setVideoElement}
                        className="overflow-hidden rounded-xl shadow-lg"
                      />
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">
                          {contentData.title}
                        </h2>
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
                        <h2 className="text-xl font-semibold">
                          {contentData.title}
                        </h2>
                        {contentData.description && (
                          <p className="text-muted-foreground mt-2">
                            {contentData.description}
                          </p>
                        )}
                      </div>
                      <QuizPlayer
                        quizId={contentData.id}
                        onComplete={handleComplete}
                        isCompleted={isCourseCompleted}
                      />
                    </div>
                  ) : null}

                  <ItemNavigation
                    itemIds={progressData?.itemIds ?? []}
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
            </div>
          )}
        </LearnMainContent>

        {currentItemId && contentData && (
          <AIChatSidebar
            courseId={course.id}
            courseTitle={course.title}
            itemId={currentItemId}
            itemTitle={contentData.title}
            itemType={contentData.type}
            currentTime={currentVideoTimeRef.current}
            videoElement={videoElement}
            documentUrl={
              contentData.type === "document" ? contentData.url : undefined
            }
            documentFileName={
              contentData.type === "document" ? contentData.fileName : undefined
            }
            documentMimeType={
              contentData.type === "document" ? contentData.mimeType : undefined
            }
          />
        )}
      </div>
    </>
  );
}

function LearnMainContent({ children }: { children: React.ReactNode }) {
  return (
    <DualSidebarInset className="overflow-y-auto">{children}</DualSidebarInset>
  );
}

function PageSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      <div className="h-16 border-b border-border/40" />
      <LearnPageSkeleton />
    </div>
  );
}

function LearnPageSkeleton() {
  return (
    <div className="flex flex-1">
      <div className="bg-sidebar hidden w-[24rem] shrink-0 border-r md:block">
        <div className="bg-muted/30 border-b p-4">
          <Skeleton className="mb-2 h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 flex-1" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-12 w-full rounded-lg" />
              <div className="space-y-1 pl-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
