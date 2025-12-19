import { Link } from "@tanstack/react-router";
import { BookOpen, Star, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@learnbase/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import { Image } from "@learnbase/ui";
import { formatPrice, getInitials } from "@/lib/format";
import type { CampusCourse } from "@/services/campus/service";

type CourseCardProps = {
  course: CampusCourse;
};

export function CourseCard({ course }: CourseCardProps) {
  const { t } = useTranslation();

  const hasDiscount = course.originalPrice && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.originalPrice!) * 100)
    : 0;

  const priceText = formatPrice(course.price, course.currency) ?? t("campus.course.free");

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
          {hasDiscount && (
            <div className="absolute right-3 top-3">
              <Badge variant="destructive" size="sm">
                -{discountPercent}%
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary"
              size="sm"
            >
              {t(`campus.course.levels.${course.level}`)}
            </Badge>
          </div>
        </div>

        <div className="p-5">
          {course.instructor && (
            <div className="mb-3 flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
                <AvatarFallback className="text-[10px]">{getInitials(course.instructor.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {course.instructor.name}
              </span>
            </div>
          )}

          <h3 className="mb-2 line-clamp-2 font-semibold leading-tight transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {course.shortDescription}
          </p>

          <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
            {course.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{course.rating}</span>
                <span>{t("campus.course.reviews", { count: course.reviewsCount })}</span>
              </div>
            )}
            {course.studentsCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="size-3.5" />
                <span>{course.studentsCount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              <span>{t("campus.course.modules", { count: course.modulesCount })}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 border-t border-border/50 pt-4">
            <span className="text-xl font-bold">
              {priceText}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(course.originalPrice!, course.currency)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
