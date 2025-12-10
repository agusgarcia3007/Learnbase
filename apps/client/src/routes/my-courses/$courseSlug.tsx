import { useEffect, useCallback, useState, useMemo } from "react";
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
import { CampusHeader } from "@/components/campus/header";
import { LearnSidebar } from "@/components/learn/learn-sidebar";
import { LearnDrawer } from "@/components/learn/learn-drawer";
import { AIChatSidebar } from "@/components/learn/ai-chat-sidebar";
import { ItemNavigation } from "@/components/learn";
import { VideoContent } from "@/components/campus/content-viewer/video-content";
import { DocumentContent } from "@/components/campus/content-viewer/document-content";
import { QuizPlayer } from "@/components/campus/quiz/quiz-player";
import {
  useCourseStructure,
  useItemContent,
  useCompleteItem,
} from "@/services/learn";
import { useCampusTenant } from "@/services/campus/queries";
import { useVideoProgress } from "@/hooks/use-video-progress";
import { useTheme } from "@/components/ui/theme-provider";
import { useCustomTheme } from "@/hooks/use-custom-theme";
import { cn } from "@/lib/utils";
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
  component: LearnPage,
});

function LearnPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { courseSlug } = Route.useParams();
  const { item: currentItemId } = Route.useSearch();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiSidebarCollapsed, setAiSidebarCollapsed] = useState(true);

  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const { data: structureData, isLoading: structureLoading } =
    useCourseStructure(courseSlug);

  const { data: contentData, isLoading: contentLoading } = useItemContent(
    currentItemId ?? ""
  );

  const { mutate: completeItem } = useCompleteItem(courseSlug);

  const { handleTimeUpdate, handlePause, reset: resetVideoProgress } =
    useVideoProgress(currentItemId ?? "");

  const tenant = tenantData?.tenant;
  const { customStyles } = useCustomTheme(tenant?.customTheme);

  const currentItemStatus = useMemo(() => {
    if (!currentItemId || !structureData) return null;
    for (const module of structureData.modules) {
      const item = module.items.find((i) => i.id === currentItemId);
      if (item) return item.status;
    }
    return null;
  }, [currentItemId, structureData]);

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

  if (tenantLoading || !tenant) {
    return <PageSkeleton />;
  }

  const themeClass =
    !tenant.customTheme && tenant.theme ? `theme-${tenant.theme}` : "";

  if (structureLoading) {
    return (
      <div
        className={cn("flex min-h-screen flex-col", themeClass)}
        style={customStyles}
      >
        <CampusHeader tenant={tenant} />
        <main className="flex-1">
          <LearnPageSkeleton />
        </main>
      </div>
    );
  }

  if (!structureData) {
    return (
      <div
        className={cn("flex min-h-screen flex-col", themeClass)}
        style={customStyles}
      >
        <CampusHeader tenant={tenant} />
        <main className="flex flex-1 items-center justify-center">
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
      </div>
    );
  }

  const { enrollment, modules } = structureData;

  return (
    <div
      className={cn("flex min-h-screen flex-col", themeClass)}
      style={customStyles}
    >
      <CampusHeader tenant={tenant} />

      <div className="flex flex-1">
        <LearnSidebar
          modules={modules}
          progress={enrollment.progress}
          currentItemId={currentItemId ?? null}
          onItemSelect={handleItemSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
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
                      isCompleted={currentItemStatus === "completed"}
                    />
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
          </div>
        </main>

        <AIChatSidebar
          collapsed={aiSidebarCollapsed}
          onToggleCollapsed={() => setAiSidebarCollapsed(!aiSidebarCollapsed)}
        />
      </div>

      <LearnDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        modules={modules}
        progress={enrollment.progress}
        currentItemId={currentItemId ?? null}
        onItemSelect={(itemId) => {
          handleItemSelect(itemId);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border/40" />
      <LearnPageSkeleton />
    </div>
  );
}

function LearnPageSkeleton() {
  return (
    <div className="flex">
      <div className="hidden w-96 shrink-0 border-r lg:block">
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <div className="pl-4 space-y-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-full max-w-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
