import { Link } from "@tanstack/react-router";
import { BookOpen, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image } from "@/components/ui/image";
import type { CampusCourse } from "@/services/campus/service";

type CourseCardProps = {
  course: CampusCourse;
};

const levelLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const levelVariants: Record<string, "success" | "warning" | "info"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "info",
};

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency,
  }).format(price / 100);
}

export function CourseCard({ course }: CourseCardProps) {
  const hasDiscount = course.originalPrice && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.originalPrice!) * 100)
    : 0;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link
      to="/courses/$courseSlug"
      params={{ courseSlug: course.slug }}
      className="group block"
    >
      <article className="overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5">
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
              variant={levelVariants[course.level]}
              appearance="light"
              size="sm"
            >
              {levelLabels[course.level]}
            </Badge>
          </div>
        </div>

        <div className="p-5">
          {course.instructor && (
            <div className="mb-3 flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
                <AvatarFallback>{getInitials(course.instructor.name)}</AvatarFallback>
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
                <span>({course.reviewsCount})</span>
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
              <span>{course.modulesCount} modulos</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 border-t border-border/50 pt-4">
            <span className="text-xl font-bold">
              {formatPrice(course.price, course.currency)}
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
