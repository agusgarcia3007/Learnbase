import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { HeroSection } from "@/components/campus/hero-section";
import { CourseGrid } from "@/components/campus/course-grid";
import {
  useCampusTenant,
  useCampusCourses,
  useCampusStats,
} from "@/services/campus/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  LandingHeader,
  LandingHero,
  LandingFeatures,
  LandingFooter,
} from "@/components/landing";
import { getTenantFromHost, getMainDomainUrl } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { BookOpen } from "lucide-react";
import { getServerTenantData } from "@/lib/server-data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: () => getServerTenantData(),
  head: ({ loaderData }) => {
    if (!loaderData?.isCampus || !loaderData?.tenant) {
      return {
        meta: seo({
          title: "LearnPress - Crea tu academia online con IA",
          description:
            "La plataforma todo-en-uno para creadores, empresas y organizaciones que quieren transformar el conocimiento en impacto. Agente IA integrado, WhatsApp y mas.",
        }),
      };
    }

    const { tenant } = loaderData;
    return {
      meta: seo({
        title: tenant.seoTitle || tenant.name,
        description: tenant.seoDescription,
        image: tenant.logo,
        keywords: tenant.seoKeywords,
      }),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { isCampus } = Route.useRouteContext();

  if (isCampus) {
    return <CampusHome />;
  }

  return <MainHome />;
}

function MainHome() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}

function CampusHome() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const { data: coursesData, isLoading: coursesLoading } = useCampusCourses({
    limit: 8,
  });
  const { data: statsData } = useCampusStats();

  useEffect(() => {
    const tenantMode = tenantData?.tenant?.mode;
    if (tenantMode === "light" || tenantMode === "dark") {
      setTheme(tenantMode);
    } else if (tenantMode === "auto") {
      setTheme("system");
    }
  }, [tenantData?.tenant?.mode, setTheme]);

  if (tenantLoading) {
    return <CampusSkeleton />;
  }

  if (!tenantData?.tenant) {
    return <CampusNotFound />;
  }

  const themeClass = tenantData.tenant.theme ? `theme-${tenantData.tenant.theme}` : "";
  const hasCourses = coursesData?.courses && coursesData.courses.length > 0;

  return (
    <div className={cn("flex min-h-screen flex-col", themeClass)}>
      <CampusHeader tenant={tenantData.tenant} />
      <main className="flex-1">
        <HeroSection tenant={tenantData.tenant} stats={statsData?.stats} />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {coursesLoading ? (
            <CourseGridSkeleton />
          ) : hasCourses ? (
            <CourseGrid
              courses={coursesData.courses}
              title="Cursos destacados"
              description="Explora nuestros cursos mas populares"
            />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>{t("campus.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("campus.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </main>
      <CampusFooter tenant={tenantData.tenant} />
    </div>
  );
}

function CampusSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border/40 bg-background" />
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto mb-6 h-8 w-48" />
          <Skeleton className="mx-auto mb-4 h-12 w-full max-w-lg" />
          <Skeleton className="mx-auto h-6 w-96" />
        </div>
      </div>
    </div>
  );
}

function CourseGridSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-5 w-72" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/50"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-5">
              <Skeleton className="mb-3 h-6 w-24" />
              <Skeleton className="mb-2 h-5 w-full" />
              <Skeleton className="mb-4 h-4 w-3/4" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampusNotFound() {
  const { t } = useTranslation();
  const { slug } = getTenantFromHost();
  const mainDomainUrl = getMainDomainUrl();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl font-bold text-muted-foreground/30">
          404
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          {t("campusNotFound.title")}
        </h1>
        <p className="mb-2 text-muted-foreground">
          {t("campusNotFound.description", { slug })}
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("campusNotFound.hint")}
        </p>

        <a href={mainDomainUrl}>
          <Button>{t("campusNotFound.goToMain")} </Button>
        </a>
      </div>
    </div>
  );
}
