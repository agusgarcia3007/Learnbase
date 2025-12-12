import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CampusTenant, CampusStats } from "@/services/campus/service";
import type { BackgroundPattern } from "@/services/tenants/service";

type HeroSectionProps = {
  tenant: CampusTenant;
  stats?: CampusStats;
};

const DEFAULT_TITLE = "Aprende las habilidades del futuro";
const DEFAULT_SUBTITLE = "Cursos online de alta calidad para impulsar tu carrera. Aprende a tu ritmo.";
const DEFAULT_CTA = "Explorar cursos";

const PATTERN_CLASSES: Record<BackgroundPattern, string> = {
  none: "",
  grid: "bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]",
  dots: "bg-[radial-gradient(#8884_1.5px,transparent_1.5px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]",
  waves: "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 16'%3E%3Cpath fill='none' stroke='%238888' stroke-width='1' d='M0 8c16 0 16-6 32-6s16 6 32 6'/%3E%3C/svg%3E\")] bg-[size:64px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]",
};

export function HeroSection({ tenant, stats }: HeroSectionProps) {
  const title = tenant.heroTitle || DEFAULT_TITLE;
  const subtitle = tenant.heroSubtitle || DEFAULT_SUBTITLE;
  const cta = tenant.heroCta || DEFAULT_CTA;
  const pattern = tenant.heroPattern ?? "grid";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className={cn("absolute inset-0", PATTERN_CLASSES[pattern])} />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {tenant.name}
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/courses" search={{ campus: undefined }}>
              <Button size="lg" className="gap-2 px-8">
                {cta}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          {stats && (
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="size-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <div className="text-sm text-muted-foreground">Cursos</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="size-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">
                    {stats.totalStudents.toLocaleString()}+
                  </div>
                  <div className="text-sm text-muted-foreground">Estudiantes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
