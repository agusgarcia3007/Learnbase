import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { CourseHeader } from "@/components/campus/course-detail/course-header";
import { CourseCurriculum } from "@/components/campus/course-detail/course-curriculum";
import {
  CourseSidebar,
  CourseRequirements,
  CourseObjectives,
  CourseInstructor,
} from "@/components/campus/course-detail/course-sidebar";
import {
  getCampusCourseServer,
  getCampusTenantServer,
} from "@/services/campus/server";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { setResolvedSlug } from "@/lib/tenant";
import { Skeleton } from "@learnbase/ui";
import { ChevronLeft } from "lucide-react";
import { Button } from "@learnbase/ui";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { computeThemeStyles } from "@/lib/theme.server";
import { createCourseSeoMeta, createGoogleFontLinks, createFaviconLinks, BASE_URL } from "@/lib/seo";
import { createCourseSchema, createBreadcrumbSchema } from "@/lib/json-ld";

export const Route = createFileRoute("/courses/$courseSlug")({
  component: CourseDetailPage,
  loader: async ({ params }) => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    if (!tenantInfo.slug) {
      return { slug: null, course: null, tenant: null, themeClass: "", customStyles: undefined };
    }
    const [courseData, tenantData] = await Promise.all([
      getCampusCourseServer({
        data: { tenantSlug: tenantInfo.slug, courseSlug: params.courseSlug },
      }),
      getCampusTenantServer({ data: { slug: tenantInfo.slug } }),
    ]);
    const tenant = tenantData?.tenant ?? null;
    const { themeClass, customStyles } = computeThemeStyles(tenant);
    return {
      slug: tenantInfo.slug,
      course: courseData?.course ?? null,
      tenant,
      themeClass,
      customStyles,
    };
  },
  head: ({ loaderData, params }) => {
    const tenant = loaderData?.tenant;
    const tenantName = tenant?.name || "LearnBase";
    const customTheme = tenant?.customTheme;
    const fontLinks = createGoogleFontLinks([
      customTheme?.fontHeading,
      customTheme?.fontBody,
    ]);
    const faviconLinks = createFaviconLinks(tenant?.favicon);
    const tenantBaseUrl = tenant?.slug
      ? `https://${tenant.slug}.uselearnbase.com`
      : BASE_URL;

    if (!loaderData?.course) {
      return {
        meta: [{ title: `Course Not Found | ${tenantName}` }],
        links: [...fontLinks, ...faviconLinks],
      };
    }

    const { course } = loaderData;
    const seo = createCourseSeoMeta({
      title: course.title,
      description: course.shortDescription || course.description,
      slug: params.courseSlug,
      image: course.thumbnail,
      price: course.price,
      instructor: course.instructor?.name,
      siteName: tenantName,
      baseUrl: tenantBaseUrl,
    });

    return {
      ...seo,
      links: [...(seo.links || []), ...fontLinks, ...faviconLinks],
      scripts: [
        createCourseSchema({
          name: course.title,
          description: course.shortDescription || course.description,
          slug: params.courseSlug,
          image: course.thumbnail,
          price: course.price,
          instructor: course.instructor
            ? {
                name: course.instructor.name,
                image: course.instructor.avatar || undefined,
              }
            : undefined,
          language: "en",
        }),
        createBreadcrumbSchema([
          { name: "Home", url: tenantBaseUrl },
          { name: "Courses", url: `${tenantBaseUrl}/courses` },
          {
            name: course.title,
            url: `${tenantBaseUrl}/courses/${params.courseSlug}`,
          },
        ]),
      ],
    };
  },
});

function CourseDetailPage() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const loaderData = Route.useLoaderData();
  const { slug, tenant, course, themeClass, customStyles } = loaderData;

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

  if (!course) {
    return (
      <div
        className={cn("flex min-h-screen flex-col", themeClass)}
        style={customStyles}
      >
        <CampusHeader tenant={tenant} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-bold">
            {t("campus.courseNotFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("campus.courseNotFound.description")}
          </p>
          <Link to="/courses" search={{ campus: undefined }}>
            <Button>{t("campus.courseNotFound.viewAllCourses")}</Button>
          </Link>
        </main>
        <CampusFooter tenant={tenant} />
      </div>
    );
  }

  return (
    <div
      className={cn("flex min-h-screen flex-col", themeClass)}
      style={customStyles}
    >
      <CampusHeader tenant={tenant} />

      <main className="flex-1">
        <div className="relative">
          <CourseHeader
            course={course}
            pattern={tenant.coursesPagePattern || "grid"}
          />

          <div className="absolute right-4 top-0 hidden w-[340px] lg:right-8 lg:block xl:right-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            <div className="sticky top-20 pt-6">
              <CourseSidebar course={course} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 lg:hidden">
          <CourseSidebar course={course} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="lg:max-w-[calc(100%-380px)]">
            <div className="mb-6">
              <Link to="/courses" search={{ campus: undefined }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  {t("campus.navigation.backToCourses")}
                </Button>
              </Link>
            </div>

            <div className="space-y-10">
              <CourseObjectives objectives={course.objectives} />

              <CourseCurriculum course={course} />

              {course.description && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">
                    {t("campus.courseDetail.description")}
                  </h2>
                  <div className="prose prose-zinc max-w-none dark:prose-invert">
                    <p className="leading-relaxed text-muted-foreground">
                      {course.description}
                    </p>
                  </div>
                </div>
              )}

              <CourseRequirements requirements={course.requirements} />

              <CourseInstructor course={course} />
            </div>
          </div>
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
      <CourseDetailSkeleton />
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-primary/4 to-background" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <Skeleton className="mb-4 h-9 w-full max-w-2xl" />
            <Skeleton className="mb-2 h-9 w-3/4" />

            <Skeleton className="mb-6 h-5 w-full max-w-xl" />

            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>

            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-0 hidden w-[340px] lg:right-8 lg:block xl:right-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          <div className="sticky top-20 pt-6">
            <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-xl">
              <Skeleton className="aspect-video w-full" />
              <div className="p-5">
                <div className="mb-3 flex items-baseline gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>

                <div className="space-y-2.5">
                  <Skeleton className="h-11 w-full rounded-md" />
                </div>

                <Skeleton className="mx-auto my-4 h-4 w-48" />

                <div className="space-y-3 border-t pt-4">
                  <Skeleton className="h-4 w-32" />
                  <div className="space-y-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 border-t pt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:hidden">
        <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-xl">
          <Skeleton className="aspect-video w-full" />
          <div className="p-5">
            <div className="mb-3 flex items-baseline gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="mx-auto my-4 h-4 w-48" />
            <div className="space-y-3 border-t pt-4">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="size-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:max-w-[calc(100%-380px)]">
          <Skeleton className="mb-6 h-5 w-36" />

          <div className="space-y-10">
            <div className="rounded-lg border border-border p-6">
              <Skeleton className="mb-5 h-7 w-56" />
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 size-5 shrink-0" />
                    <Skeleton className="h-5 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-48" />
              <Skeleton className="mb-3 h-4 w-56" />
              <div className="overflow-hidden rounded-lg border border-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center justify-between bg-muted/40 px-4 py-3.5">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-36" />
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
                    <Skeleton className="h-5 flex-1 max-w-md" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-28" />
              <div className="flex items-start gap-4">
                <Skeleton className="size-16 shrink-0 rounded-full" />
                <div className="space-y-2 pt-2 flex-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
