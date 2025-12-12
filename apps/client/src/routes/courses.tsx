import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useTenantInfo } from "@/hooks/use-tenant-info";

export const Route = createFileRoute("/courses")({
  component: CoursesLayout,
});

function CoursesLayout() {
  const { isCampus } = useTenantInfo();

  if (!isCampus) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
