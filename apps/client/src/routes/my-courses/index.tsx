import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { EnrolledCourseCard } from "@/components/campus/enrolled-course-card";
import { Button } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@learnbase/ui";
import { createSeoMeta, createGoogleFontLinks, createFaviconLinks } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useEnrollments } from "@/services/enrollments";
import { useTheme } from "@/components/ui/theme-provider";
import { getCampusTenantServer } from "@/services/campus/server";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { computeThemeStyles } from "@/lib/theme.server";
import { setResolvedSlug } from "@/lib/tenant";

export const Route = createFileRoute("/my-courses/")({
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    if (!tenantInfo.slug) {
      return { slug: null, tenant: null, themeClass: "", customStyles: undefined };
    }
    const tenantData = await getCampusTenantServer({ data: { slug: tenantInfo.slug } });
    const tenant = tenantData?.tenant ?? null;
    const { themeClass, customStyles } = computeThemeStyles(tenant);
    return { slug: tenantInfo.slug, tenant, themeClass, customStyles };
  },
  head: ({ loaderData }) => {
    const tenant = loaderData?.tenant;
    const customTheme = tenant?.customTheme;
    const fontLinks = createGoogleFontLinks([
      customTheme?.fontHeading,
      customTheme?.fontBody,
    ]);
    const faviconLinks = createFaviconLinks(tenant?.favicon);
    return {
      ...createSeoMeta({
        title: "My Courses",
        description: "View and continue your enrolled courses",
        noindex: true,
      }),
      links: [...fontLinks, ...faviconLinks],
    };
  },
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();

  const loaderData = Route.useLoaderData();
  const { slug, tenant, themeClass, customStyles } = loaderData;

  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useEnrollments();

  useEffect(() => {
    if (slug) {
      setResolvedSlug(slug);
    }
  }, [slug]);

  useEffect(() => {
    const tenantMode = tenant?.mode;
    if (tenantMode === "light" || tenantMode === "dark") {
      setTheme(tenantMode);
    } else if (tenantMode === "auto") {
      setTheme("system");
    }
  }, [tenant?.mode, setTheme]);

  if (!tenant) {
    return <PageSkeleton />;
  }

  const enrollments = enrollmentsData?.enrollments ?? [];

  return (
    <div className={cn("flex min-h-screen flex-col", themeClass)} style={customStyles}>
      <CampusHeader tenant={tenant} />

      <main className="flex-1">
        <div className="border-b border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {t("enrollments.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("enrollments.description")}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {enrollmentsLoading ? (
            <CoursesGridSkeleton />
          ) : enrollments.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>{t("enrollments.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("enrollments.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link to="/courses" search={{ campus: undefined }}>
                  <Button>{t("enrollments.empty.cta")}</Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {enrollments.map((enrollment) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CampusFooter tenant={tenant} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border/40" />
      <div className="border-b border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <Skeleton className="mb-2 h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <CoursesGridSkeleton />
      </div>
    </div>
  );
}

function CoursesGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/50"
        >
          <Skeleton className="aspect-video w-full" />
          <div className="p-5">
            <Skeleton className="mb-3 h-6 w-24" />
            <Skeleton className="mb-2 h-5 w-full" />
            <Skeleton className="mb-4 h-4 w-3/4" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
