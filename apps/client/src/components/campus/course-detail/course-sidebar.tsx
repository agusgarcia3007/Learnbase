import {
  Check,
  FileText,
  Heart,
  Infinity,
  Layers,
  Play,
  Share2,
  Smartphone,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CampusCourseDetail } from "@/services/campus/service";

type CourseSidebarProps = {
  course: CampusCourseDetail;
};

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100);
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const hasDiscount = course.originalPrice && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.originalPrice!) * 100)
    : 0;

  const isFree = course.price === 0;

  return (
    <Card className="sticky top-20 overflow-hidden border-border/50 shadow-xl">
      <div className="relative aspect-video cursor-pointer group">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            layout="fullWidth"
            aspectRatio={16 / 9}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <Play className="size-16 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 transition-opacity group-hover:bg-black/70">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-transparent transition-transform group-hover:scale-110">
            <Play className="size-7 fill-white text-white" />
          </div>
          <span className="mt-3 text-sm font-medium text-white">Vista previa del curso</span>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatPrice(course.price, course.currency)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(course.originalPrice!, course.currency)}
              </span>
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {discountPercent}% dto.
              </span>
            </>
          )}
        </div>

        {hasDiscount && (
          <p className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">Oferta termina pronto</span>
          </p>
        )}

        <div className="space-y-2.5">
          <Button size="lg" className="w-full font-semibold">
            {isFree ? "Inscribirse gratis" : "Comprar ahora"}
          </Button>

          {!isFree && (
            <Button size="lg" variant="outline" className="w-full font-semibold">
              Agregar al carrito
            </Button>
          )}
        </div>

        <p className="my-4 text-center text-xs text-muted-foreground">
          Garantia de devolucion de 30 dias
        </p>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">Este curso incluye:</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Play className="size-4 shrink-0" />
              <span>{course.lessonsCount} lecciones en video</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Layers className="size-4 shrink-0" />
              <span>{course.modulesCount} modulos de contenido</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0" />
              <span>Recursos descargables</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Infinity className="size-4 shrink-0" />
              <span>Acceso de por vida</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Smartphone className="size-4 shrink-0" />
              <span>Acceso en movil y TV</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="size-4 shrink-0" />
              <span>Certificado de finalizacion</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 border-t pt-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Share2 className="size-4" />
            <span>Compartir</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Heart className="size-4" />
            <span>Favorito</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseRequirements({ requirements }: { requirements: string[] }) {
  if (!requirements.length) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Requisitos</h2>
      <ul className="space-y-2.5">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" />
            <span className="text-[15px]">{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CourseObjectives({ objectives }: { objectives: string[] }) {
  if (!objectives.length) return null;

  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="mb-5 text-xl font-bold">Lo que aprenderas</h2>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {objectives.map((obj, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-foreground" />
            <span className="text-[15px]">{obj}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseInstructor({ course }: { course: CampusCourseDetail }) {
  if (!course.instructor) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Instructor</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-28 rounded-full border-4 border-background shadow-lg">
            <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
            <AvatarFallback className="text-2xl font-semibold">
              {getInitials(course.instructor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 pt-2">
            <h3 className="text-lg font-bold text-primary underline">{course.instructor.name}</h3>
            {course.instructor.title && (
              <p className="text-muted-foreground">{course.instructor.title}</p>
            )}
          </div>
        </div>
        {course.instructor.bio && (
          <p className="leading-relaxed text-muted-foreground">{course.instructor.bio}</p>
        )}
      </div>
    </div>
  );
}
