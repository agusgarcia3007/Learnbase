import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { CourseGrid } from "@/components/campus/course-grid";
import { useCampusCourses } from "@/services/campus/queries";
import {
  getCampusTenantServer,
  getCampusCoursesServer,
  getCampusCategoriesServer,
} from "@/services/campus/server";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { computeThemeStyles } from "@/lib/theme.server";
import { setResolvedSlug } from "@/lib/tenant";
import type { CampusTenant, CampusCourse, CampusCategory } from "@/services/campus/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Search, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSeo } from "@/hooks/use-seo";
import { useTheme } from "@/components/ui/theme-provider";
import { createSeoMeta, createGoogleFontLinks, createFaviconLinks } from "@/lib/seo";
import { createBreadcrumbSchema } from "@/lib/json-ld";
import type { BackgroundPattern } from "@/services/tenants/service";

const PATTERN_CLASSES: Record<BackgroundPattern, string> = {
  none: "",
  grid: "text-primary/15 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000_70%,transparent_110%)]",
  dots: "text-primary/20 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000_70%,transparent_110%)]",
  waves: "text-primary/15 bg-[radial-gradient(ellipse_100%_100%_at_100%_50%,transparent_20%,currentColor_21%,currentColor_22%,transparent_23%),radial-gradient(ellipse_100%_100%_at_0%_50%,transparent_20%,currentColor_21%,currentColor_22%,transparent_23%)] bg-[size:32px_16px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000_70%,transparent_110%)]",
};

const catalogSeo = createSeoMeta({
  title: "Online Courses",
  description:
    "Explore our complete collection of online courses. Learn at your own pace with quality content.",
  url: "https://uselearnbase.com/courses",
  keywords:
    "online courses, e-learning, digital training, virtual classes, learn online",
});

type LoaderData = {
  slug: string | null;
  tenant: CampusTenant | null;
  courses: CampusCourse[];
  categories: CampusCategory[];
  themeClass: string;
  customStyles: ReturnType<typeof computeThemeStyles>["customStyles"];
};

export const Route = createFileRoute("/courses/")({
  component: CoursesPage,
  loader: async (): Promise<LoaderData> => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    if (!tenantInfo.slug) {
      return { slug: null, tenant: null, courses: [], categories: [], themeClass: "", customStyles: undefined };
    }

    const [tenantData, coursesData, categoriesData] = await Promise.all([
      getCampusTenantServer({ data: { slug: tenantInfo.slug } }),
      getCampusCoursesServer({ data: { slug: tenantInfo.slug, limit: 100 } }),
      getCampusCategoriesServer({ data: { slug: tenantInfo.slug } }),
    ]);

    const tenant = tenantData?.tenant ?? null;
    const { themeClass, customStyles } = computeThemeStyles(tenant);

    return {
      slug: tenantInfo.slug,
      tenant,
      courses: coursesData?.courses ?? [],
      categories: categoriesData?.categories ?? [],
      themeClass,
      customStyles,
    };
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
      ...catalogSeo,
      links: [...fontLinks, ...faviconLinks],
      scripts: [
        createBreadcrumbSchema([
          { name: "Home", url: "https://uselearnbase.com" },
          { name: "Courses", url: "https://uselearnbase.com/courses" },
        ]),
      ],
    };
  },
});

function CoursesPage() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { slug, tenant, courses: initialCourses, categories, themeClass, customStyles } = Route.useLoaderData();

  const hasFilters = !!(search || selectedCategory || selectedLevel);

  const { data: filteredCoursesData, isLoading: isFiltering } = useCampusCourses(
    {
      search: search || undefined,
      category: selectedCategory || undefined,
      level: selectedLevel || undefined,
    },
    { enabled: hasFilters }
  );

  const courses = hasFilters ? (filteredCoursesData?.courses ?? []) : initialCourses;
  const coursesLoading = hasFilters && isFiltering;

  useEffect(() => {
    if (slug) {
      setResolvedSlug(slug);
    }
  }, [slug]);

  useSeo({
    title: tenant?.seoTitle
      ? `Cursos | ${tenant.seoTitle}`
      : tenant?.name
      ? `Cursos | ${tenant.name}`
      : null,
    description: tenant?.seoDescription,
    keywords: tenant?.seoKeywords,
  });

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

  const levels = [
    { value: "beginner", label: "Principiante" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ];

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedLevel(null);
  };

  const pattern: BackgroundPattern = tenant.coursesPagePattern || "grid";

  return (
    <div className={cn("flex min-h-screen flex-col", themeClass)} style={customStyles}>
      <CampusHeader tenant={tenant} />

      <main className="flex-1">
        <div className="relative overflow-hidden border-b border-border/40 bg-muted/30">
          <div className={cn("absolute inset-0", PATTERN_CLASSES[pattern])} />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Todos los cursos
            </h1>
            <p className="text-muted-foreground">
              Explora nuestra coleccion completa de cursos
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {levels.map((level) => (
              <Button
                key={level.value}
                variant={selectedLevel === level.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() =>
                  setSelectedLevel(
                    selectedLevel === level.value ? null : level.value
                  )
                }
              >
                {level.label}
              </Button>
            ))}

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-2 text-muted-foreground"
              >
                <X className="mr-1 size-3" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {coursesLoading ? (
            <CourseGridSkeleton />
          ) : courses.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>
                  {hasFilters
                    ? t("campus.emptyFiltered.title")
                    : t("campus.empty.title")}
                </EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? t("campus.emptyFiltered.description")
                    : t("campus.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <EmptyContent>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="mr-2 size-4" />
                    Limpiar filtros
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <CourseGrid courses={courses} />
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
        <CourseGridSkeleton />
      </div>
    </div>
  );
}

function CourseGridSkeleton() {
  return (
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
  );
}
