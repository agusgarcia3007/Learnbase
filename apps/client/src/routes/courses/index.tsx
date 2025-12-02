import { createFileRoute } from "@tanstack/react-router";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { CourseGrid } from "@/components/campus/course-grid";
import { useCampusTenant, useCampusCourses, useCampusCategories } from "@/services/campus/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/")({
  component: CoursesPage,
});

function CoursesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: tenantData, isLoading: tenantLoading } = useCampusTenant();
  const { data: categoriesData } = useCampusCategories();
  const { data: coursesData, isLoading: coursesLoading } = useCampusCourses({
    search: search || undefined,
    category: selectedCategory || undefined,
    level: selectedLevel || undefined,
  });

  if (tenantLoading || !tenantData?.tenant) {
    return <PageSkeleton />;
  }

  const levels = [
    { value: "beginner", label: "Principiante" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ];

  const hasFilters = search || selectedCategory || selectedLevel;

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedLevel(null);
  };

  const themeClass = tenantData.tenant.theme ? `theme-${tenantData.tenant.theme}` : "";

  return (
    <div className={cn("flex min-h-screen flex-col", themeClass)}>
      <CampusHeader tenant={tenantData.tenant} />

      <main className="flex-1">
        <div className="border-b border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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

            <div className="flex flex-wrap items-center gap-2">
              {categoriesData?.categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.slug ? "primary" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.slug ? null : category.slug
                    )
                  }
                >
                  {category.name}
                </Badge>
              ))}
            </div>
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
          ) : coursesData?.courses.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">
                No se encontraron cursos
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <CourseGrid courses={coursesData?.courses || []} />
          )}
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
        <div key={i} className="overflow-hidden rounded-xl border border-border/50">
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
