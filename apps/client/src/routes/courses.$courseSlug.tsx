import { createFileRoute, redirect, Link } from "@tanstack/react-router";
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
import { useCampusTenant, useCampusCourse } from "@/services/campus/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses/$courseSlug")({
  beforeLoad: ({ context }) => {
    if (!context.isCampus) {
      throw redirect({ to: "/" });
    }
  },
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseSlug } = Route.useParams();
  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const { data: courseData, isLoading: courseLoading } = useCampusCourse(courseSlug);

  if (tenantLoading || !tenantData?.tenant) {
    return <PageSkeleton />;
  }

  if (courseLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <CampusHeader tenant={tenantData.tenant} />
        <main className="flex-1">
          <CourseDetailSkeleton />
        </main>
        <CampusFooter tenant={tenantData.tenant} />
      </div>
    );
  }

  if (!courseData?.course) {
    return (
      <div className="flex min-h-screen flex-col">
        <CampusHeader tenant={tenantData.tenant} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-bold">Curso no encontrado</h1>
          <p className="text-muted-foreground">
            El curso que buscas no existe o ha sido eliminado.
          </p>
          <Link to="/courses">
            <Button>Ver todos los cursos</Button>
          </Link>
        </main>
        <CampusFooter tenant={tenantData.tenant} />
      </div>
    );
  }

  const { course } = courseData;

  return (
    <div className="flex min-h-screen flex-col">
      <CampusHeader tenant={tenantData.tenant} />

      <main className="flex-1">
        <div className="relative">
          <CourseHeader course={course} />

          <div className="absolute right-4 top-0 hidden w-[340px] lg:right-8 lg:block xl:right-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            <div className="pt-6">
              <CourseSidebar course={course} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="lg:max-w-[calc(100%-380px)]">
            <div className="mb-6">
              <Link to="/courses">
                <Button variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
                  <ChevronLeft className="size-4" />
                  Volver a cursos
                </Button>
              </Link>
            </div>

            <div className="space-y-10">
              <CourseObjectives objectives={course.objectives} />

              <CourseCurriculum course={course} />

              {course.description && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Descripcion</h2>
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

          <div className="mt-10 lg:hidden">
            <CourseSidebar course={course} />
          </div>
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
      <CourseDetailSkeleton />
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div>
      <div className="relative bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-3 flex gap-2">
              <Skeleton className="h-6 w-24 bg-zinc-700" />
              <Skeleton className="h-6 w-20 bg-zinc-700" />
            </div>
            <Skeleton className="mb-4 h-10 w-full bg-zinc-700" />
            <Skeleton className="mb-5 h-5 w-3/4 bg-zinc-700" />
            <div className="mb-5 flex gap-4">
              <Skeleton className="h-5 w-32 bg-zinc-700" />
              <Skeleton className="h-5 w-28 bg-zinc-700" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full bg-zinc-700" />
              <Skeleton className="h-5 w-32 bg-zinc-700" />
            </div>
          </div>
        </div>

        <div className="absolute right-8 top-6 hidden w-[340px] lg:block">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:max-w-[calc(100%-380px)]">
          <Skeleton className="mb-6 h-5 w-32" />

          <div className="space-y-10">
            <div className="rounded-lg border p-6">
              <Skeleton className="mb-5 h-7 w-48" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-48" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-4 h-7 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>

        <div className="mt-10 lg:hidden">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
