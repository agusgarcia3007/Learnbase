import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, getInitials } from "@/lib/format";
import { useRelatedCourses, type RelatedCourse } from "@/services/learn";

type RelatedCourseCardProps = {
  course: RelatedCourse;
};

function RelatedCourseCard({ course }: RelatedCourseCardProps) {
  const priceText = formatPrice(course.price, course.currency);

  return (
    <Link
      to="/courses/$courseSlug"
      params={{ courseSlug: course.slug }}
      search={{ campus: undefined }}
      className="group block"
    >
      <article className="overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative aspect-video overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              layout="fullWidth"
              aspectRatio={16 / 9}
              className="transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <BookOpen className="size-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="p-4">
          {course.instructor && (
            <div className="mb-2 flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage
                  src={course.instructor.avatar ?? undefined}
                  alt={course.instructor.name}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(course.instructor.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {course.instructor.name}
              </span>
            </div>
          )}

          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          <div className="text-base font-bold">{priceText}</div>
        </div>
      </article>
    </Link>
  );
}

function RelatedCourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-5 w-16" />
      </div>
    </div>
  );
}

type RelatedCoursesSectionProps = {
  courseSlug: string;
};

export function RelatedCoursesSection({ courseSlug }: RelatedCoursesSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useRelatedCourses(courseSlug);

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="mb-6 text-xl font-semibold">{t("learn.relatedCourses")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RelatedCourseSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.courses.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-semibold">{t("learn.relatedCourses")}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.courses.map((course) => (
          <RelatedCourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
