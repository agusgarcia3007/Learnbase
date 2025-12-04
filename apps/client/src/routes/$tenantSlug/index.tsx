import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, BookOpen, Users, BarChart3 } from "lucide-react";
import { getCampusUrl } from "@/lib/tenant";
import { useGetTenantStats } from "@/services/tenants";

export const Route = createFileRoute("/$tenantSlug/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { tenant } = Route.useRouteContext();
  const campusUrl = getCampusUrl(tenant.slug);
  const { data, isLoading } = useGetTenantStats(tenant.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido a {tenant.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Administra tus cursos, clases y contenido desde aqui.
          </p>
        </div>
        <a href={campusUrl} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2">
            <ExternalLink className="size-4" />
            Ver Campus
          </Button>
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cursos</CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.stats.totalCourses}
              </div>
            )}
            <p className="text-xs text-muted-foreground">cursos publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.stats.totalStudents}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              estudiantes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                ${data?.stats.totalRevenue}
              </div>
            )}
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Campus</CardTitle>
          <CardDescription>
            Tu plataforma de cursos esta disponible en el siguiente enlace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">
              {campusUrl}
            </code>
            <a href={campusUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="size-3.5" />
                Abrir
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
