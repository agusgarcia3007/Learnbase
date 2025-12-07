import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronLeft, Construction } from "lucide-react";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { useCampusTenant, useCampusCourse } from "@/services/campus/queries";
import { useEnrollmentCheck } from "@/services/enrollments";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";

export const Route = createFileRoute("/courses/$courseSlug/learn")({
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
  const { setTheme } = useTheme();
  const { courseSlug } = Route.useParams();

  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const { data: courseData, isLoading: courseLoading } =
    useCampusCourse(courseSlug);
  const { data: enrollmentData, isLoading: enrollmentLoading } =
    useEnrollmentCheck(courseData?.course?.id ?? "");

  useEffect(() => {
    const tenantMode = tenantData?.tenant?.mode;
    if (tenantMode === "light" || tenantMode === "dark") {
      setTheme(tenantMode);
    } else if (tenantMode === "auto") {
      setTheme("system");
    }
  }, [tenantData?.tenant?.mode, setTheme]);

  if (tenantLoading || !tenantData?.tenant) {
    return <PageSkeleton />;
  }

  const themeClass = tenantData.tenant.theme
    ? `theme-${tenantData.tenant.theme}`
    : "";

  const isLoading = courseLoading || enrollmentLoading;

  if (isLoading) {
    return (
      <div className={cn("flex min-h-screen flex-col", themeClass)}>
        <CampusHeader tenant={tenantData.tenant} />
        <main className="flex flex-1 items-center justify-center">
          <Skeleton className="h-64 w-full max-w-md" />
        </main>
        <CampusFooter tenant={tenantData.tenant} />
      </div>
    );
  }

  if (!courseData?.course) {
    return (
      <div className={cn("flex min-h-screen flex-col", themeClass)}>
        <CampusHeader tenant={tenantData.tenant} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-bold">
            {t("campus.courseNotFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("campus.courseNotFound.description")}
          </p>
          <Link to="/courses">
            <Button>{t("campus.courseNotFound.viewAllCourses")}</Button>
          </Link>
        </main>
        <CampusFooter tenant={tenantData.tenant} />
      </div>
    );
  }

  if (!enrollmentData?.isEnrolled) {
    return (
      <div className={cn("flex min-h-screen flex-col", themeClass)}>
        <CampusHeader tenant={tenantData.tenant} />
        <main className="flex flex-1 items-center justify-center px-4">
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle>{t("enrollments.notEnrolled.title")}</EmptyTitle>
              <EmptyDescription>
                {t("enrollments.notEnrolled.description")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link to="/courses/$courseSlug" params={{ courseSlug }}>
                <Button>{t("enrollments.notEnrolled.cta")}</Button>
              </Link>
            </EmptyContent>
          </Empty>
        </main>
        <CampusFooter tenant={tenantData.tenant} />
      </div>
    );
  }

  const { course } = courseData;

  return (
    <div className={cn("flex min-h-screen flex-col", themeClass)}>
      <CampusHeader tenant={tenantData.tenant} />

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Construction />
              </EmptyMedia>
              <EmptyTitle>{t("enrollments.comingSoon.title")}</EmptyTitle>
              <EmptyDescription>
                {t("enrollments.comingSoon.description", {
                  course: course.title,
                })}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to="/courses/$courseSlug" params={{ courseSlug }}>
                  <Button variant="outline">
                    <ChevronLeft className="mr-1 size-4" />
                    {t("enrollments.comingSoon.backToCourse")}
                  </Button>
                </Link>
                <Link to="/my-courses">
                  <Button>{t("enrollments.myCourses")}</Button>
                </Link>
              </div>
            </EmptyContent>
          </Empty>
        </div>
      </main>

      <CampusFooter tenant={tenantData.tenant} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border/40" />
      <div className="flex flex-1 items-center justify-center py-20">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    </div>
  );
}
