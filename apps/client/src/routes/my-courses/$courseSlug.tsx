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
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { CampusHeader } from "@/components/campus/header";
import { LearnContentSidebar } from "@/components/learn/learn-content-sidebar";
import { AIChatSidebar } from "@/components/learn/ai-chat-sidebar";
import { CourseCompletedView } from "@/components/learn/course-completed-view";
import { ItemNavigation } from "@/components/learn";
import { MobileModulesList } from "@/components/learn/mobile-modules-list";
import { VideoContentWithSubtitles } from "@/components/campus/content-viewer/video-content-with-subtitles";
import { DocumentContent } from "@/components/campus/content-viewer/document-content";
import { QuizPlayer } from "@/components/campus/quiz/quiz-player";
import {
  useCourseStructure,
  useCourseProgress,
  useItemContent,
  useCompleteItem,
  type ModuleProgressData,
} from "@/services/learn";
import { useVideoSubtitles } from "@/services/subtitles";
import { useVideoProgress } from "@/hooks/use-video-progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/components/ui/theme-provider";
import { computeThemeStyles } from "@/lib/theme.server";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getCampusTenantServer } from "@/services/campus/server";
import { setResolvedSlug } from "@/lib/tenant";
import { createSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { LearnService } from "@/services/learn/service";
import type { CampusTenant } from "@/services/campus/service";

type CourseSearch = {
  item?: string;
};

export const Route = createFileRoute("/my-courses/$courseSlug")({
  validateSearch: (search: Record<string, unknown>): CourseSearch => ({
    item: (search.item as string) || undefined,
  }),
  loader: async ({ params }) => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    const [courseResult, tenantResult] = await Promise.all([
      LearnService.getCourseStructure(params.courseSlug).catch(() => ({ course: null })),
      tenantInfo.slug ? getCampusTenantServer({ data: { slug: tenantInfo.slug } }) : null,
    ]);
    const tenant = tenantResult?.tenant ?? null;
    const { themeClass, customStyles } = computeThemeStyles(tenant);
    return {
      slug: tenantInfo.slug,
      course: courseResult?.course ?? null,
      tenant,
      themeClass,
      customStyles,
    };
  },
  head: ({ loaderData }) => {
    const tenantName = loaderData?.tenant?.name || "LearnBase";

    if (!loaderData?.course) {
      return {
        meta: [{ title: `Course Not Found | ${tenantName}` }],
      };
    }

    const { course } = loaderData;
    return createSeoMeta({
      title: course.title,
      description: course.description ?? "",
      siteName: tenantName,
    });
  },
  component: LearnPageWrapper,
});

function LearnPageWrapper() {
  const loaderData = Route.useLoaderData();
  const { slug, tenant, themeClass, customStyles } = loaderData;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (slug) {
      setResolvedSlug(slug);
    }
  }, [slug]);

  if (!tenant) {
    return <PageSkeleton />;
  }

  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      defaultRightOpen={false}
      sidebarWidth="24rem"
      headerHeight="4rem"
      className={cn("flex-col", themeClass)}
      style={customStyles}
    >
      <LearnPage tenant={tenant} />
    </SidebarProvider>
  );
}

type LearnPageProps = {
  tenant: CampusTenant;
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

  const videoId = contentData?.type === "video" ? contentData.id : "";
  const { data: subtitlesData } = useVideoSubtitles(videoId);

  const availableSubtitles = useMemo(() => {
    if (!subtitlesData?.subtitles) return [];
    return subtitlesData.subtitles
      .filter((s) => s.status === "completed" && s.vttUrl)
      .map((s) => ({
        language: s.language,
        label: s.label,
        vttUrl: s.vttUrl,
      }));
  }, [subtitlesData?.subtitles]);

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

  const moduleProgress = useMemo(() => {
    const map = new Map<string, ModuleProgressData>();
    if (progressData?.moduleProgress) {
      for (const p of progressData.moduleProgress) {
        map.set(p.moduleId, p);
      }
    }
    return map;
  }, [progressData?.moduleProgress]);

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
              <Button onClick={() => navigate({ to: "/courses", search: { campus: undefined } })}>
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
                      <VideoContentWithSubtitles
                        src={contentData.url ?? ""}
                        initialTime={contentData.videoProgress}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onPause={(time) => handlePause(time)}
                        onSeeked={handleSeeked}
                        onComplete={handleComplete}
                        onVideoRefReady={setVideoElement}
                        availableSubtitles={availableSubtitles}
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

                  <MobileModulesList
                    modules={modules}
                    moduleProgress={moduleProgress}
                    currentItemId={currentItemId}
                    currentModuleId={currentModuleId}
                    onItemSelect={handleItemSelect}
                    courseSlug={courseSlug}
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
            assistantName={tenant.aiAssistantSettings?.name}
            assistantAvatar={tenant.aiAssistantSettings?.avatarUrl}
          />
        )}
      </div>
    </>
  );
}

function LearnMainContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="overflow-y-auto">{children}</SidebarInset>
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
