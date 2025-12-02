import { Clock, FileText, Globe, Layers, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CampusCourseDetail } from "@/services/campus/service";

type CourseHeaderProps = {
  course: CampusCourseDetail;
};

const levelLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export function CourseHeader({ course }: CourseHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-zinc-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {course.categoryName && (
              <Badge className="border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                {course.categoryName}
              </Badge>
            )}
            <Badge variant="outline" className="border-zinc-600 text-zinc-300">
              {levelLabels[course.level]}
            </Badge>
            {course.rating > 0 && (
              <Badge className="border-amber-500/50 bg-amber-500/20 text-amber-300">
                <Star className="mr-1 size-3 fill-current" />
                Bestseller
              </Badge>
            )}
          </div>

          <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>

          <p className="mb-5 text-base text-zinc-300 sm:text-lg">
            {course.shortDescription}
          </p>

          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {course.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-400">{course.rating.toFixed(1)}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < Math.floor(course.rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-600 text-zinc-600"}`}
                    />
                  ))}
                </div>
                <span className="text-purple-400 underline">
                  ({course.reviewsCount.toLocaleString()} resenas)
                </span>
              </div>
            )}
            {course.studentsCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Users className="size-4" />
                <span>{course.studentsCount.toLocaleString()} estudiantes</span>
              </div>
            )}
          </div>

          {course.instructor && (
            <div className="mb-5 flex items-center gap-3">
              <span className="text-sm text-zinc-400">Creado por</span>
              <div className="flex items-center gap-2">
                <Avatar className="size-8 border-2 border-zinc-700">
                  <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
                  <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                    {getInitials(course.instructor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-purple-400 underline">
                  {course.instructor.name}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>Ultima actualizacion reciente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="size-4" />
              <span className="capitalize">{course.language === "es" ? "Espanol" : course.language}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="size-4" />
              <span>{course.modulesCount} modulos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="size-4" />
              <span>{course.lessonsCount} lecciones</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
